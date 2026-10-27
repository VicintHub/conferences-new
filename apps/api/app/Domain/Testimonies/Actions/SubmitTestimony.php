<?php

namespace App\Domain\Testimonies\Actions;

use App\Domain\Registration\Models\Attendee;
use App\Domain\Testimonies\Models\Testimony;
use Illuminate\Http\UploadedFile;

class SubmitTestimony
{
    /**
     * Stores a testimony as pending for the media team to review. A signed-in attendee's own name and church
     * are used; guests supply them. With "show my name" off the public sees "A delegate from {place}".
     *
     * @param  array<string, mixed>  $data  validated payload (see StoreTestimonyRequest)
     */
    public function __invoke(array $data, ?Attendee $attendee, ?UploadedFile $media): Testimony
    {
        $name = $attendee?->full_name ?? $data['name'];
        $place = $data['place'] ?? $attendee?->location ?? $attendee?->church;
        $showName = (bool) ($data['show_name'] ?? true);

        return Testimony::create([
            'attendee_id' => $attendee?->id,
            'author_name' => $name,
            'display_name' => $showName ? $name : 'A delegate'.($place ? " from {$place}" : ''),
            'label' => $place,
            'type' => $data['type'],
            'body' => $data['body'] ?? null,
            'media_path' => $media?->store('testimonies', 'public'),
            'tags' => array_values(array_unique($data['tags'] ?? [])),
            'show_name' => $showName,
            'status' => 'pending',
        ]);
    }
}
