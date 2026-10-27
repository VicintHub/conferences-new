<?php

namespace App\Domain\Applications\Actions;

use App\Domain\Applications\Models\Application;
use Illuminate\Http\UploadedFile;

/** Stores uploads on the private disk (served only through authorised endpoints) and clears an outstanding request. */
class AttachDocuments
{
    /** @param  list<UploadedFile>  $files */
    public function __invoke(Application $application, array $files): void
    {
        foreach ($files as $file) {
            $application->documents()->create([
                'path' => $file->store("applications/{$application->id}"),
                'original_name' => mb_substr($file->getClientOriginalName(), 0, 190),
                'mime' => (string) $file->getMimeType(),
                'size' => (int) $file->getSize(),
            ]);
        }

        if ($files !== [] && $application->requested_info !== null) {
            $application->forceFill(['requested_info' => null])->save();
        }
    }
}
