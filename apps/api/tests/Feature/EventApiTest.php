<?php

namespace Tests\Feature;

use Tests\TestCase;

class EventApiTest extends TestCase
{
    public function test_health_endpoint_reports_ok(): void
    {
        $this->getJson('/api/v1/health')->assertOk()->assertExactJson(['status' => 'ok']);
    }

    public function test_event_endpoint_exposes_countdown_target(): void
    {
        $this->getJson('/api/v1/event')
            ->assertOk()
            ->assertJsonPath('data.starts_at', '2027-01-19T17:00:00+01:00')
            ->assertJsonPath('data.onsite_capacity', 2500);
    }

    public function test_me_requires_authentication(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized();
    }
}
