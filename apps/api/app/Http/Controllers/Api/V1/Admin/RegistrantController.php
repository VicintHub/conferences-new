<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Registration\Enums\AttendanceMode;
use App\Domain\Registration\Enums\RegistrationCategory;
use App\Domain\Registration\Models\Registration;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class RegistrantController extends Controller
{
    private const PER_PAGE = 25;

    public function index(Request $request): JsonResponse
    {
        $page = $this->filtered($request)->with('attendee')->orderByDesc('id')->paginate(self::PER_PAGE);

        return response()->json([
            'data' => $page->getCollection()->map(fn (Registration $r) => $this->row($r))->values(),
            'meta' => ['page' => $page->currentPage(), 'last_page' => $page->lastPage(), 'total' => $page->total()],
        ]);
    }

    /** Everything the registration desk needs in a spreadsheet. Cells that could run as formulas are neutralised. */
    public function export(Request $request): StreamedResponse
    {
        $query = $this->filtered($request)->with('attendee')->orderBy('id');

        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Claim code', 'Name', 'Email', 'Phone', 'Church', 'Location', 'Category', 'Mode', 'Status', 'Needs accommodation', 'Registered at']);
            $query->lazyById(500)->each(function (Registration $r) use ($out) {
                $row = $this->row($r);
                fputcsv($out, array_map(self::safe(...), [
                    $row['claim_code'], $row['name'], $row['email'], $row['phone'], $row['church'], $row['location'],
                    $row['category'], $row['mode'], $row['status'], $row['needs_accommodation'] ? 'yes' : 'no', $row['registered_at'],
                ]));
            });
            fclose($out);
        }, 'jan-conf-registrants.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private static function safe(mixed $v): string
    {
        $v = (string) $v;

        return $v !== '' && str_contains('=+-@'."\t\r", $v[0]) ? "'".$v : $v;
    }

    private function filtered(Request $request): Builder
    {
        $f = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category' => ['nullable', Rule::enum(RegistrationCategory::class)],
            'mode' => ['nullable', Rule::enum(AttendanceMode::class)],
            'status' => ['nullable', Rule::in(['pending_verification', 'confirmed'])],
        ]);

        return Registration::query()
            ->when($f['category'] ?? null, fn ($q, $v) => $q->where('category', $v))
            ->when($f['mode'] ?? null, fn ($q, $v) => $q->where('mode', $v))
            ->when($f['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when(trim($f['search'] ?? ''), function ($q, $term) {
                $like = '%'.addcslashes($term, '%_\\').'%';
                $q->where(fn ($w) => $w->where('claim_code', 'like', $like)->orWhereHas('attendee', fn ($a) => $a
                    ->where('full_name', 'like', $like)->orWhere('email', 'like', $like)->orWhere('church', 'like', $like)->orWhere('phone', 'like', $like)));
            });
    }

    private function row(Registration $r): array
    {
        return [
            'id' => $r->id,
            'claim_code' => $r->claim_code,
            'name' => $r->attendee->full_name,
            'email' => $r->attendee->email,
            'phone' => $r->attendee->phone,
            'church' => $r->attendee->church,
            'location' => $r->attendee->location,
            'category' => $r->category->value,
            'mode' => $r->mode->value,
            'status' => $r->status,
            'needs_accommodation' => $r->needs_accommodation,
            'minister_verified' => (bool) $r->minister_verified_at,
            'registered_at' => $r->created_at->toIso8601String(),
        ];
    }
}
