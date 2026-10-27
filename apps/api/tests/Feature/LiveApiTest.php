<?php

namespace Tests\Feature;

use App\Domain\Live\Actions\SendSessionReminders;
use App\Domain\Live\Models\LiveState;
use App\Domain\Live\Models\Replay;
use App\Domain\Live\Models\SessionReminder;
use App\Domain\Programme\Models\ProgrammeSession;
use App\Domain\Registration\Models\Attendee;
use App\Mail\SessionReminderMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class LiveApiTest extends TestCase
{
    use RefreshDatabase;

    private function attendee(string $email = 'ade@example.com'): Attendee
    {
        $a = Attendee::create(['full_name' => 'Adebayo Ogunleye', 'email' => $email, 'age_band' => '18-45', 'email_verified_at' => now()]);
        $a->registration()->create(['category' => 'delegate', 'mode' => 'online', 'days' => ['2027-01-19'], 'status' => 'confirmed', 'claim_code' => 'JC27-DLG-'.random_int(10000, 99999)]);

        return $a;
    }

    private function as(Attendee $a): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($a->createToken('t')->plainTextToken);
    }

    private function programmeSession(string $start, int $minutes = 60): ProgrammeSession
    {
        $at = Carbon::parse($start);

        return ProgrammeSession::create(['day' => $at->toDateString(), 'starts_at' => $at, 'ends_at' => $at->copy()->addMinutes($minutes), 'title' => 'IYLC', 'subtitle' => 'Main hall', 'kind' => 'iylc']);
    }

    public function test_the_stream_is_for_signed_in_attendees(): void
    {
        $this->getJson('/api/v1/live')->assertUnauthorized();
        $this->postJson('/api/v1/live/heartbeat')->assertUnauthorized();
    }

    public function test_off_air_by_default_then_live_with_a_stream(): void
    {
        $a = $this->attendee();
        $this->as($a)->getJson('/api/v1/live')->assertOk()
            ->assertJsonPath('data.is_live', false)->assertJsonPath('data.video', null)->assertJsonPath('data.radio', null)->assertJsonPath('data.viewers', 0);

        LiveState::current()->update(['is_live' => true, 'video_url' => 'https://cdn.example.com/live/main.m3u8', 'radio_url' => 'https://cdn.example.com/radio', 'title' => 'Royal Conference']);
        $this->as($a)->getJson('/api/v1/live')
            ->assertJsonPath('data.is_live', true)->assertJsonPath('data.title', 'Royal Conference')
            ->assertJsonPath('data.video', ['kind' => 'hls', 'url' => 'https://cdn.example.com/live/main.m3u8'])
            ->assertJsonPath('data.radio.url', 'https://cdn.example.com/radio');
    }

    public function test_video_links_are_classified_and_only_known_embeds_are_framed(): void
    {
        $kind = fn (string $url) => tap(LiveState::current())->update(['video_url' => $url])->fresh()->video();

        $this->assertSame(['kind' => 'embed', 'url' => 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0'], $kind('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
        $this->assertSame('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0', $kind('https://youtu.be/dQw4w9WgXcQ')['url']);
        $this->assertSame(['kind' => 'embed', 'url' => 'https://player.vimeo.com/video/123456?autoplay=1'], $kind('https://vimeo.com/123456'));
        $this->assertSame('file', $kind('https://cdn.example.com/clip.mp4')['kind']);
        $this->assertSame('hls', $kind('https://cdn.example.com/a/live.m3u8?token=x')['kind']);
        $this->assertSame('file', $kind('https://evil.example/watch?v=dQw4w9WgXcQ')['kind']); // never framed
        $this->assertNull($kind(''));
    }

    public function test_heartbeats_count_distinct_viewers_who_are_still_watching(): void
    {
        Carbon::setTestNow('2027-01-23 10:00:00');
        $a = $this->attendee();
        $b = $this->attendee('b@example.com');

        $this->as($a)->postJson('/api/v1/live/heartbeat')->assertOk()->assertJsonPath('data.viewers', 1);
        $this->as($a)->postJson('/api/v1/live/heartbeat')->assertJsonPath('data.viewers', 1); // same person
        $this->as($b)->postJson('/api/v1/live/heartbeat')->assertJsonPath('data.viewers', 2);

        Carbon::setTestNow('2027-01-23 10:03:00');
        $this->assertSame(0, $this->as($a)->getJson('/api/v1/live')->json('data.viewers'));
        $this->assertSame(1, DB::table('live_viewers')->where('attendee_id', $a->id)->count());
        Carbon::setTestNow();
    }

    public function test_replays_come_newest_first_with_playable_ones_marked(): void
    {
        Replay::create(['title' => 'Day 2', 'recorded_on' => '2027-01-21', 'duration_seconds' => 6760, 'video_url' => 'https://cdn.example.com/d2.m3u8', 'sort' => 0]);
        Replay::create(['title' => 'Hidden', 'recorded_on' => '2027-01-22', 'duration_seconds' => 1, 'active' => false, 'sort' => 0]);
        Replay::create(['title' => 'Day 3', 'recorded_on' => '2027-01-22', 'duration_seconds' => 8048, 'sort' => 0]);

        $res = $this->as($this->attendee())->getJson('/api/v1/live')->assertOk();
        $this->assertSame(['Day 3', 'Day 2'], array_column($res->json('data.replays'), 'title'));
        $this->assertNull($res->json('data.replays.0.video'));
        $this->assertSame('hls', $res->json('data.replays.1.video.kind'));
    }

    public function test_reminders_can_be_set_listed_and_cleared_but_not_for_finished_sessions(): void
    {
        Carbon::setTestNow('2027-01-23 10:00:00');
        $a = $this->attendee();
        $upcoming = $this->programmeSession('2027-01-23 14:00:00');
        $past = $this->programmeSession('2027-01-23 08:00:00');

        $this->as($a)->postJson("/api/v1/sessions/{$upcoming->id}/remind")->assertCreated();
        $this->as($a)->postJson("/api/v1/sessions/{$upcoming->id}/remind")->assertCreated();
        $this->assertSame(1, SessionReminder::count());
        $this->as($a)->postJson("/api/v1/sessions/{$past->id}/remind")->assertUnprocessable();
        $this->assertSame([$upcoming->id], $this->as($a)->getJson('/api/v1/live')->json('data.reminders'));

        $other = $this->attendee('b@example.com');
        $this->assertSame([], $this->as($other)->getJson('/api/v1/live')->json('data.reminders'));

        $this->as($a)->deleteJson("/api/v1/sessions/{$upcoming->id}/remind")->assertNoContent();
        $this->assertSame(0, SessionReminder::count());
        Carbon::setTestNow();
    }

    public function test_reminders_go_out_once_shortly_before_the_session(): void
    {
        Mail::fake();
        Carbon::setTestNow('2027-01-23 13:00:00');
        $a = $this->attendee();
        $soon = $this->programmeSession('2027-01-23 13:10:00');
        $later = $this->programmeSession('2027-01-23 16:00:00');
        SessionReminder::create(['attendee_id' => $a->id, 'session_id' => $soon->id]);
        SessionReminder::create(['attendee_id' => $a->id, 'session_id' => $later->id]);

        $this->assertSame(1, app(SendSessionReminders::class)());
        $this->assertSame(0, app(SendSessionReminders::class)(), 'sent only once');
        Mail::assertQueued(SessionReminderMail::class, 1);
        Mail::assertQueued(SessionReminderMail::class, fn ($m) => $m->hasTo('ade@example.com') && $m->startsAt === '1:10 PM');

        Carbon::setTestNow('2027-01-23 15:50:00');
        $this->assertSame(1, app(SendSessionReminders::class)());
        Carbon::setTestNow();
    }
}
