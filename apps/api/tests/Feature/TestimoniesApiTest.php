<?php

namespace Tests\Feature;

use App\Domain\Programme\Models\ProgrammeSession;
use App\Domain\Registration\Models\Attendee;
use App\Domain\Testimonies\Models\SurveyResponse;
use App\Domain\Testimonies\Models\Testimony;
use Database\Seeders\TestimonySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class TestimoniesApiTest extends TestCase
{
    use RefreshDatabase;

    private function attendee(string $email = 'ade@example.com'): Attendee
    {
        $a = Attendee::create(['full_name' => 'Adebayo Ogunleye', 'email' => $email, 'church' => 'Christ Life Assembly', 'location' => 'Oyo', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $a->registration()->create(['category' => 'delegate', 'mode' => 'onsite', 'days' => [], 'status' => 'confirmed', 'claim_code' => 'JC27-DLG-'.random_int(10000, 99999)]);

        return $a;
    }

    private function as(Attendee $a): static
    {
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();

        return $this->withToken($a->createToken('t')->plainTextToken);
    }

    public function test_public_feed_lists_only_approved_with_featured_and_tags(): void
    {
        $this->seed(TestimonySeeder::class);
        Testimony::create(['author_name' => 'X', 'display_name' => 'X', 'type' => 'write', 'body' => 'pending one pending one', 'tags' => [], 'status' => 'pending']);

        $res = $this->getJson('/api/v1/testimonies')->assertOk();

        $this->assertCount(6, $res->json('data'));
        $this->assertSame('Pastor Femi A.', $res->json('featured.display_name'));
        $this->assertSame('/images/photos/lp-about-1.webp', $res->json('featured.poster_url'));
        $this->assertContains('Healing', $res->json('meta.tags'));
        $this->assertStringNotContainsString('pending one', $res->getContent());
    }

    public function test_feed_filters_by_tag_and_paginates_with_a_cursor(): void
    {
        $this->seed(TestimonySeeder::class);

        $this->assertCount(1, $this->getJson('/api/v1/testimonies?tag=Healing')->json('data'));

        foreach (range(1, 15) as $i) {
            Testimony::create(['author_name' => "P{$i}", 'display_name' => "P{$i}", 'type' => 'write', 'body' => "Body number {$i} here", 'tags' => ['Family'], 'status' => 'approved', 'published_at' => now()->subMinutes($i)]);
        }
        $first = $this->getJson('/api/v1/testimonies?tag=Family')->assertOk();
        $this->assertCount(12, $first->json('data'));
        $cursor = $first->json('meta.next_cursor');
        $this->assertNotNull($cursor);
        $second = $this->getJson('/api/v1/testimonies?tag=Family&cursor='.$cursor);
        $this->assertCount(3, $second->json('data'));
        $this->assertNull($second->json('featured'));
        $this->assertNull($second->json('meta.next_cursor'));
    }

    public function test_guest_can_submit_and_it_waits_for_moderation(): void
    {
        $res = $this->postJson('/api/v1/testimonies', ['type' => 'write', 'name' => 'Grace Ade', 'place' => 'Ibadan', 'body' => 'God healed my back during the Thursday session.', 'tags' => ['Healing'], 'show_name' => true])
            ->assertCreated()->assertJsonPath('data.status', 'pending');

        $t = Testimony::find($res->json('data.id'));
        $this->assertSame('Grace Ade', $t->display_name);
        $this->assertSame('pending', $t->status);
        $this->assertCount(0, $this->getJson('/api/v1/testimonies')->json('data'));
    }

    public function test_hiding_the_name_publishes_a_delegate_from_the_place(): void
    {
        $this->as($this->attendee())->postJson('/api/v1/testimonies', ['type' => 'write', 'body' => 'Provision came in a way I did not expect.', 'tags' => ['Provision'], 'show_name' => false])->assertCreated();

        $t = Testimony::first();
        $this->assertSame('Adebayo Ogunleye', $t->author_name);
        $this->assertSame('A delegate from Oyo', $t->display_name);
        $this->assertSame($t->attendee_id, Attendee::first()->id);
    }

    public function test_signed_in_attendee_name_wins_over_a_supplied_one(): void
    {
        $this->as($this->attendee())->postJson('/api/v1/testimonies', ['type' => 'write', 'name' => 'Someone Else', 'body' => 'A long enough testimony text.'])->assertCreated();
        $this->assertSame('Adebayo Ogunleye', Testimony::first()->display_name);
    }

    public function test_validation_rules(): void
    {
        $this->postJson('/api/v1/testimonies', ['type' => 'write', 'body' => 'short'])->assertJsonValidationErrors(['name', 'body']);
        $this->postJson('/api/v1/testimonies', ['type' => 'write', 'name' => 'Grace', 'body' => str_repeat('a', 601)])->assertJsonValidationErrors('body');
        $this->postJson('/api/v1/testimonies', ['type' => 'write', 'name' => 'Grace', 'body' => 'Long enough body text', 'tags' => ['Healing', 'Family', 'Provision', 'Ministry']])->assertJsonValidationErrors('tags');
        $this->postJson('/api/v1/testimonies', ['type' => 'write', 'name' => 'Grace', 'body' => 'Long enough body text', 'tags' => ['Bogus']])->assertJsonValidationErrors('tags.0');
        $this->postJson('/api/v1/testimonies', ['type' => 'video', 'name' => 'Grace'])->assertJsonValidationErrors('media');
        $this->assertDatabaseCount('testimonies', 0);
    }

    public function test_voice_and_video_uploads_are_stored_and_type_checked(): void
    {
        Storage::fake('public');

        $this->post('/api/v1/testimonies', ['type' => 'video', 'name' => 'Grace', 'media' => UploadedFile::fake()->create('t.mp4', 500, 'video/mp4')], ['Accept' => 'application/json'])->assertCreated();
        $this->post('/api/v1/testimonies', ['type' => 'voice', 'name' => 'Grace', 'media' => UploadedFile::fake()->create('t.mp3', 100, 'audio/mpeg')], ['Accept' => 'application/json'])->assertCreated();
        $this->post('/api/v1/testimonies', ['type' => 'voice', 'name' => 'Grace', 'media' => UploadedFile::fake()->create('t.exe', 10, 'application/x-msdownload')], ['Accept' => 'application/json'])->assertStatus(422);

        $this->assertCount(2, Storage::disk('public')->allFiles('testimonies'));
        $this->assertSame(['video', 'voice'], Testimony::orderBy('id')->pluck('type')->all());
    }

    public function test_amen_is_idempotent_and_reversible_and_needs_a_token(): void
    {
        $this->seed(TestimonySeeder::class);
        $t = Testimony::where('amen_count', 402)->first();

        $this->putJson("/api/v1/testimonies/{$t->id}/amen")->assertUnauthorized();

        $a = $this->attendee();
        $this->as($a)->putJson("/api/v1/testimonies/{$t->id}/amen")->assertOk()->assertJsonPath('data.amen_count', 403);
        $this->as($a)->putJson("/api/v1/testimonies/{$t->id}/amen")->assertOk()->assertJsonPath('data.amen_count', 403);
        $this->as($a)->getJson('/api/v1/testimonies')->assertJsonPath('data.0.amened', false);

        $res = $this->as($a)->getJson('/api/v1/testimonies?tag=Healing');
        $this->assertTrue($res->json('data.0.amened'));

        $this->as($a)->deleteJson("/api/v1/testimonies/{$t->id}/amen")->assertOk()->assertJsonPath('data.amen_count', 402);
        $this->as($a)->deleteJson("/api/v1/testimonies/{$t->id}/amen")->assertOk()->assertJsonPath('data.amen_count', 402);
    }

    public function test_cannot_amen_an_unapproved_testimony(): void
    {
        $t = Testimony::create(['author_name' => 'X', 'display_name' => 'X', 'type' => 'write', 'body' => 'pending testimony body', 'tags' => [], 'status' => 'pending']);
        $this->as($this->attendee())->putJson("/api/v1/testimonies/{$t->id}/amen")->assertNotFound();
    }

    public function test_session_feedback_is_saved_once_per_session_and_editable(): void
    {
        $a = $this->attendee();
        $started = ProgrammeSession::create(['day' => '2020-01-01', 'starts_at' => now()->subHours(3), 'ends_at' => now()->subHour(), 'title' => 'Royal Conference', 'kind' => 'plenary']);

        $this->as($a)->postJson("/api/v1/sessions/{$started->id}/feedback", ['rating' => 4, 'highlights' => ['The word', 'Worship'], 'comment' => 'Great'])->assertCreated();
        $this->as($a)->postJson("/api/v1/sessions/{$started->id}/feedback", ['rating' => 5, 'highlights' => ['Sound']])->assertCreated();

        $this->assertDatabaseCount('session_feedback', 1);
        $this->assertDatabaseHas('session_feedback', ['rating' => 5]);
        $this->as($a)->getJson('/api/v1/me/feedback')->assertJsonPath('data.session_ids', [$started->id])->assertJsonPath('data.survey_completed', false);
    }

    public function test_session_feedback_validation_and_future_sessions(): void
    {
        $a = $this->attendee();
        $future = ProgrammeSession::create(['day' => '2099-01-01', 'starts_at' => now()->addDay(), 'ends_at' => now()->addDays(2), 'title' => 'Later', 'kind' => 'plenary']);
        $past = ProgrammeSession::create(['day' => '2020-01-01', 'starts_at' => now()->subHours(3), 'ends_at' => now()->subHour(), 'title' => 'Done', 'kind' => 'plenary']);

        $this->as($a)->postJson("/api/v1/sessions/{$future->id}/feedback", ['rating' => 5])->assertStatus(422);
        $this->as($a)->postJson("/api/v1/sessions/{$past->id}/feedback", ['rating' => 6])->assertJsonValidationErrors('rating');
        $this->as($a)->postJson("/api/v1/sessions/{$past->id}/feedback", ['rating' => 3, 'highlights' => ['Coffee']])->assertJsonValidationErrors('highlights.0');
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();
        $this->postJson("/api/v1/sessions/{$past->id}/feedback", ['rating' => 3])->assertUnauthorized();
    }

    public function test_survey_definition_and_single_submission(): void
    {
        $a = $this->attendee();

        $def = $this->as($a)->getJson('/api/v1/survey')->assertOk();
        $this->assertSame('Help us plan IMLC 2028', $def->json('data.title'));
        $this->assertCount(5, $def->json('data.questions'));
        $this->assertFalse($def->json('data.completed'));

        $answers = ['attend_next_year' => 5, 'ratings' => ['Registration' => 5, 'Venue & seating' => 4, 'Meals' => 3, 'Livestream' => 4], 'keep' => ['Worship'], 'improve' => 'Seating', 'other' => null];
        $this->as($a)->postJson('/api/v1/survey', ['answers' => $answers])->assertCreated();
        $this->assertSame(5, SurveyResponse::first()->answers['attend_next_year']);

        $this->as($a)->postJson('/api/v1/survey', ['answers' => $answers])->assertStatus(409)->assertJsonPath('code', 'already_submitted');
        $this->as($a)->getJson('/api/v1/survey')->assertJsonPath('data.completed', true);
    }

    public function test_survey_validates_required_answers(): void
    {
        $a = $this->attendee();

        $this->as($a)->postJson('/api/v1/survey', ['answers' => []])->assertJsonValidationErrors(['answers.attend_next_year', 'answers.ratings']);
        $this->as($a)->postJson('/api/v1/survey', ['answers' => ['attend_next_year' => 9, 'ratings' => ['Registration' => 5]]])
            ->assertJsonValidationErrors(['answers.attend_next_year', 'answers.ratings.Meals']);
        $this->as($a)->postJson('/api/v1/survey', ['answers' => ['attend_next_year' => 3, 'ratings' => ['Registration' => 5, 'Venue & seating' => 4, 'Meals' => 3, 'Livestream' => 4], 'keep' => ['Bogus']]])
            ->assertJsonValidationErrors('answers.keep.0');
        $this->assertDatabaseCount('survey_responses', 0);
    }
}
