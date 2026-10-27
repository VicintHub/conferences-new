<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Speakers\Models\Speaker;
use App\Http\Controllers\Controller;
use App\Http\Resources\SpeakerResource;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SpeakerController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return SpeakerResource::collection(Speaker::published()->orderBy('sort')->orderBy('id')->get())
            ->additional(['meta' => ['groups' => ['host', 'imlc_2026', 'imlc_2027']]]);
    }

    public function show(string $slug): SpeakerResource
    {
        return new SpeakerResource(Speaker::published()->where('slug', $slug)->firstOrFail());
    }
}
