<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Admin\Actions\ReviewMinister;
use App\Domain\Admin\Queries\Badges;
use App\Domain\Applications\Actions\AdvanceApplication;
use App\Domain\Applications\Enums\ApplicationStatus;
use App\Domain\Applications\Models\Application;
use App\Domain\Applications\Models\ApplicationDocument;
use App\Domain\Registration\Models\Registration;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use LogicException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApprovalController extends Controller
{
    /** Labels for what each application form asked, in the order the applicant saw them. */
    private const FIELDS = [
        'organisation' => 'Organisation', 'title' => 'Title / office', 'contact_name' => 'Contact name', 'phone' => 'Phone',
        'crew_size' => 'Crew size', 'coverage_plan' => 'Coverage plan', 'guests' => 'Guests', 'ministry' => 'Ministry',
        'topic' => 'Topic', 'bio' => 'Bio', 'business_name' => 'Business', 'category' => 'Sells', 'stall_size' => 'Stall size', 'notes' => 'Notes',
    ];

    /** The queue, oldest first, with a count per tab. */
    public function index(Request $request): JsonResponse
    {
        $kind = (string) $request->query('kind', 'all');
        [$ministers, $applications] = Badges::pendingApprovals();

        $items = $ministers->with('attendee')->get()->map(fn (Registration $r) => $this->ministerRow($r))
            ->concat($applications->with('attendee')->get()->map(fn (Application $a) => $this->applicationRow($a)))
            ->sortBy('created_at')->values();

        $counts = $items->countBy('kind')->all();

        return response()->json([
            'data' => $kind === 'all' ? $items : $items->where('kind', $kind)->values(),
            'meta' => ['counts' => ['all' => $items->count()] + $counts],
        ]);
    }

    public function show(string $key): JsonResponse
    {
        return response()->json(['data' => $this->detail($key)]);
    }

    /**
     * One endpoint for everything staff can do to an item:
     * approve | decline (either) · check | review | request_info (applications only).
     */
    public function decide(Request $request, string $key, ReviewMinister $reviewMinister, AdvanceApplication $advance): JsonResponse
    {
        $in = $request->validate([
            'action' => ['required', Rule::in(['approve', 'decline', 'check', 'review', 'request_info'])],
            'note' => ['nullable', 'string', 'max:1000'],
            'info' => ['required_if:action,request_info', 'nullable', 'string', 'max:1000'],
        ]);

        [$type, $id] = $this->parse($key);
        if ($type === 'reg') {
            abort_unless(in_array($in['action'], ['approve', 'decline'], true), 422, 'A minister can only be approved or declined.');
            $reviewMinister(Registration::with('attendee')->findOrFail($id), $in['action'] === 'approve', $in['note'] ?? null);

            return response()->json(['data' => null, 'meta' => ['badges' => (new Badges)()]]);
        }

        $application = Application::with('attendee')->findOrFail($id);
        try {
            match ($in['action']) {
                'check' => $advance($application, ApplicationStatus::DocumentsChecked),
                'review' => $advance($application, ApplicationStatus::InReview),
                'request_info' => $advance->requestInfo($application->status === ApplicationStatus::InReview ? $application : $advance($application, ApplicationStatus::InReview), $in['info']),
                'approve' => $advance($application, ApplicationStatus::Approved, $in['note'] ?? null),
                'decline' => $advance($application, ApplicationStatus::Declined, $in['note'] ?? null),
            };
        } catch (LogicException $e) {
            abort(422, $e->getMessage());
        }

        return response()->json(['data' => $this->detail($key), 'meta' => ['badges' => (new Badges)()]]);
    }

    /** Applicants' documents are private: staff download them through here. */
    public function document(int $application, int $document): StreamedResponse
    {
        $doc = ApplicationDocument::where('application_id', $application)->findOrFail($document);
        abort_unless(Storage::exists($doc->path), 404);

        return Storage::download($doc->path, $doc->original_name, ['X-Content-Type-Options' => 'nosniff']);
    }

    private function parse(string $key): array
    {
        abort_unless(preg_match('/^(reg|app)-(\d+)$/', $key, $m), 404);

        return [$m[1], (int) $m[2]];
    }

    private function detail(string $key): array
    {
        [$type, $id] = $this->parse($key);

        if ($type === 'reg') {
            $r = Registration::with('attendee')->findOrFail($id);
            $a = $r->attendee;

            return $this->ministerRow($r) + [
                'heading' => 'Minister verification',
                'facts' => array_values(array_filter([
                    ['k' => 'Church', 'v' => $a->church], ['k' => 'Location', 'v' => $a->location],
                    ['k' => 'Email', 'v' => $a->email], ['k' => 'Phone', 'v' => $a->phone],
                    ['k' => 'Attending', 'v' => ucfirst($r->mode->value)],
                ], fn ($f) => filled($f['v']))),
                'documents' => [],
                'actions' => ['approve', 'decline'],
                'requested_info' => null,
                'status' => 'pending',
            ];
        }

        $app = Application::with(['attendee', 'documents'])->findOrFail($id);
        $facts = collect(self::FIELDS)->map(fn ($label, $field) => isset($app->payload[$field]) && $app->payload[$field] !== '' ? ['k' => $label, 'v' => (string) $app->payload[$field]] : null)->filter()->values()
            ->prepend(['k' => 'Applicant', 'v' => "{$app->attendee->full_name} · {$app->attendee->email}"])->all();

        return $this->applicationRow($app) + [
            'heading' => $app->role->heading(),
            'facts' => $facts,
            'documents' => $app->documents->map(fn ($d) => ['id' => $d->id, 'name' => $d->original_name, 'size' => $d->size, 'url' => "/admin/applications/{$app->id}/documents/{$d->id}"])->values(),
            'actions' => $app->status->isFinal() ? [] : ['check', 'review', 'request_info', 'approve', 'decline'],
            'requested_info' => $app->requested_info,
            'status' => $app->status->value,
            'decision_note' => $app->decision_note,
        ];
    }

    private function ministerRow(Registration $r): array
    {
        $a = $r->attendee;

        return [
            'key' => "reg-{$r->id}", 'kind' => 'minister', 'kind_label' => 'Minister',
            'name' => $a->full_name, 'subtitle' => collect([$a->church, $a->location])->filter()->implode(', ') ?: $a->email,
            'created_at' => $r->created_at->toIso8601String(),
        ];
    }

    private function applicationRow(Application $a): array
    {
        $p = $a->payload;
        $name = match ($a->role->value) {
            'media' => $p['organisation'] ?? $a->attendee->full_name,
            'vendor' => $p['business_name'] ?? $a->attendee->full_name,
            default => $a->attendee->full_name,
        };

        return [
            'key' => "app-{$a->id}", 'kind' => $a->role->value, 'kind_label' => $a->role->label(),
            'name' => $name, 'subtitle' => $a->summary() ?: $a->attendee->email,
            'created_at' => $a->created_at->toIso8601String(),
        ];
    }
}
