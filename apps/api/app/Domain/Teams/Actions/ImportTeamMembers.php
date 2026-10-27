<?php

namespace App\Domain\Teams\Actions;

use App\Domain\Teams\Enums\MemberRole;
use App\Domain\Teams\Models\Team;
use Illuminate\Validation\ValidationException;

/** Bulk add (CSV import). A bad row is reported and skipped; it never blocks the rest. */
class ImportTeamMembers
{
    public function __construct(private AddTeamMember $add) {}

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return array{added: int, skipped: list<array{row: int, name: string, reason: string}>}
     */
    public function __invoke(Team $team, array $rows): array
    {
        $added = 0;
        $skipped = [];

        foreach ($rows as $i => $row) {
            try {
                ($this->add)($team, MemberRole::Member, $row);
                $added++;
            } catch (ValidationException $e) {
                $skipped[] = ['row' => $i + 1, 'name' => (string) ($row['full_name'] ?? ''), 'reason' => collect($e->errors())->flatten()->first()];
            }
        }

        return ['added' => $added, 'skipped' => $skipped];
    }
}
