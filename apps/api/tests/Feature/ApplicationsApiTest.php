<?php

namespace Tests\Feature;

use App\Domain\Applications\Actions\AdvanceApplication;
use App\Domain\Applications\Enums\ApplicationStatus;
use App\Domain\Applications\Models\Application;
use App\Domain\Registration\Models\Attendee;
use App\Mail\ApplicationDecisionMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use LogicException;
use Tests\TestCase;

class ApplicationsApiTest extends TestCase
{
    use RefreshDatabase;

    private function attendee(): Attendee
    {
        $a = Attendee::create(['full_name' => 'Kemi Ojo', 'email' => 'kemi@example.com', 'age_band' => '18-45', 'email_verified_at' => now()]);
        $a->registration()->create(['category' => 'delegate', 'mode' => 'online', 'days' => ['2027-01-19'], 'status' => 'confirmed', 'claim_code' => 'JC27-DLG-11111']);

        return $a;
    }

    private function as(Attendee $a): static
    {
        $this->app['auth']->forgetGuards();

        return $this->withToken($a->createToken('t')->plainTextToken);
    }

    private function media(array $over = []): array
    {
        return $over + [
            'role' => 'media', 'organisation' => 'Faith Lens TV', 'contact_name' => 'Kemi Ojo', 'phone' => '+2348031234567',
            'crew_size' => 2, 'coverage_plan' => 'Live broadcast of evening sessions',
        ];
    }

    public function test_a_media_application_is_stored_and_tracked(): void
    {
        Storage::fake('local');
        $a = $this->attendee();

        $res = $this->as($a)->post('/api/v1/me/applications', $this->media(['documents' => [UploadedFile::fake()->create('press-id.pdf', 200, 'application/pdf')]]), ['Accept' => 'application/json'])
            ->assertCreated();

        $this->assertSame('Media accreditation', $res->json('data.heading'));
        $this->assertSame('Faith Lens TV · 2 crew', $res->json('data.summary'));
        $this->assertSame('submitted', $res->json('data.status'));
        $this->assertSame(['done', 'upcoming', 'upcoming', 'upcoming'], array_column($res->json('data.timeline'), 'state'));
        $this->assertSame('press-id.pdf', $res->json('data.documents.0.name'));
        Storage::disk('local')->assertExists(Application::first()->documents()->first()->path);
    }

    public function test_each_role_asks_for_its_own_fields(): void
    {
        $a = $this->attendee();
        $base = ['contact_name' => 'Kemi Ojo', 'phone' => '+2348031234567'];

        $this->as($a)->postJson('/api/v1/me/applications', ['role' => 'media'] + $base)->assertUnprocessable()->assertJsonValidationErrors(['organisation', 'crew_size', 'coverage_plan']);
        $this->as($a)->postJson('/api/v1/me/applications', ['role' => 'vendor'] + $base)->assertUnprocessable()->assertJsonValidationErrors(['business_name', 'stall_size']);
        $this->as($a)->postJson('/api/v1/me/applications', ['role' => 'speaker'] + $base)->assertUnprocessable()->assertJsonValidationErrors(['ministry', 'topic', 'bio']);
        $this->as($a)->postJson('/api/v1/me/applications', ['role' => 'vip'] + $base)->assertUnprocessable()->assertJsonValidationErrors(['title', 'guests']);
        $this->as($a)->postJson('/api/v1/me/applications', ['role' => 'chef'])->assertUnprocessable()->assertJsonValidationErrors('role');

        $this->as($a)->postJson('/api/v1/me/applications', ['role' => 'vendor', 'business_name' => 'Grace Books', 'category' => 'books', 'stall_size' => 'm'] + $base)
            ->assertCreated()->assertJsonPath('data.summary', 'Grace Books · Stall M');
        $this->assertEquals(['business_name' => 'Grace Books', 'category' => 'books', 'stall_size' => 'm', 'contact_name' => 'Kemi Ojo', 'phone' => '+2348031234567'], Application::first()->payload);
    }

    public function test_unknown_fields_and_bad_files_are_refused(): void
    {
        Storage::fake('local');
        $a = $this->attendee();

        $this->as($a)->post('/api/v1/me/applications', $this->media(['documents' => [UploadedFile::fake()->create('virus.exe', 10)]]), ['Accept' => 'application/json'])
            ->assertUnprocessable()->assertJsonValidationErrors('documents.0');

        $this->as($a)->postJson('/api/v1/me/applications', $this->media(['is_admin' => true, 'status' => 'approved']))->assertCreated();
        $this->assertArrayNotHasKey('is_admin', Application::first()->payload);
        $this->assertSame(ApplicationStatus::Submitted, Application::first()->status);
    }

    public function test_one_open_application_per_role_but_a_declined_one_can_be_redone(): void
    {
        Mail::fake();
        $a = $this->attendee();
        $this->as($a)->postJson('/api/v1/me/applications', $this->media())->assertCreated();
        $this->as($a)->postJson('/api/v1/me/applications', $this->media())->assertUnprocessable()->assertJsonValidationErrors('role');

        app(AdvanceApplication::class)(Application::first(), ApplicationStatus::Declined, 'Capacity reached');
        $this->as($a)->postJson('/api/v1/me/applications', $this->media())->assertCreated();
        $this->assertSame(2, Application::count());
    }

    public function test_the_tracker_follows_the_committee_and_people_only_see_their_own_applications(): void
    {
        Mail::fake();
        $a = $this->attendee();
        $this->as($a)->postJson('/api/v1/me/applications', $this->media());
        $app = Application::first();
        $advance = app(AdvanceApplication::class);

        $advance($app, ApplicationStatus::DocumentsChecked);
        $advance($app, ApplicationStatus::InReview, requestedInfo: 'A copy of your press ID for each crew member.');
        $res = $this->as($a)->getJson('/api/v1/me/applications')->assertOk();
        $this->assertSame('Under review', $res->json('data.0.status_label'));
        $this->assertSame(['done', 'done', 'current', 'upcoming'], array_column($res->json('data.0.timeline'), 'state'));
        $this->assertSame('Waiting on you', $res->json('data.0.timeline.2.note'));
        $this->assertSame('A copy of your press ID for each crew member.', $res->json('data.0.requested_info'));
        $this->assertCount(4, $res->json('meta.roles'));

        $other = Attendee::create(['full_name' => 'Other', 'email' => 'o@example.com', 'email_verified_at' => now()]);
        $other->registration()->create(['category' => 'delegate', 'mode' => 'online', 'days' => ['2027-01-19'], 'status' => 'confirmed', 'claim_code' => 'JC27-DLG-22222']);
        $this->assertCount(0, $this->as($other)->getJson('/api/v1/me/applications')->json('data'));
        $this->as($other)->post("/api/v1/me/applications/{$app->id}/documents", ['documents' => [UploadedFile::fake()->create('a.pdf', 10)]], ['Accept' => 'application/json'])->assertNotFound();
    }

    public function test_uploading_what_was_asked_for_clears_the_request(): void
    {
        Storage::fake('local');
        Mail::fake();
        $a = $this->attendee();
        $this->as($a)->postJson('/api/v1/me/applications', $this->media());
        $app = Application::first();
        app(AdvanceApplication::class)($app, ApplicationStatus::InReview, requestedInfo: 'Press IDs please');

        $res = $this->as($a)->post("/api/v1/me/applications/{$app->id}/documents", ['documents' => [UploadedFile::fake()->image('id.jpg')]], ['Accept' => 'application/json'])->assertOk();

        $this->assertNull($res->json('data.requested_info'));
        $this->assertSame('id.jpg', $res->json('data.documents.0.name'));

        $this->as($a)->postJson("/api/v1/me/applications/{$app->id}/documents", [])->assertUnprocessable();
        app(AdvanceApplication::class)($app, ApplicationStatus::Approved);
        $this->as($a)->post("/api/v1/me/applications/{$app->id}/documents", ['documents' => [UploadedFile::fake()->image('x.jpg')]], ['Accept' => 'application/json'])->assertUnprocessable();
    }

    public function test_decisions_are_final_forward_only_and_emailed(): void
    {
        Mail::fake();
        $a = $this->attendee();
        $this->as($a)->postJson('/api/v1/me/applications', $this->media());
        $app = Application::first();
        $advance = app(AdvanceApplication::class);

        $advance($app, ApplicationStatus::InReview);
        try {
            $advance($app, ApplicationStatus::DocumentsChecked);
            $this->fail('moving backwards should be refused');
        } catch (LogicException) {
            $this->assertSame(ApplicationStatus::InReview, $app->fresh()->status);
        }

        $advance($app, ApplicationStatus::Approved, 'Welcome aboard');
        Mail::assertQueued(ApplicationDecisionMail::class, fn ($m) => $m->hasTo('kemi@example.com') && $m->approved);
        $res = $this->as($a)->getJson('/api/v1/me/applications');
        $this->assertSame(['done', 'done', 'done', 'done'], array_column($res->json('data.0.timeline'), 'state'));
        $this->assertSame('Approved', $res->json('data.0.timeline.3.note'));
        $this->expectException(LogicException::class);
        $advance($app, ApplicationStatus::Declined);
    }

    public function test_applications_need_a_signed_in_attendee(): void
    {
        $this->getJson('/api/v1/me/applications')->assertUnauthorized();
        $this->postJson('/api/v1/me/applications', $this->media())->assertUnauthorized();
    }
}
