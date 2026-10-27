<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Programme\Models\ProgrammeSession;
use App\Domain\Testimonies\Models\SessionFeedback;
use App\Domain\Testimonies\Models\SurveyResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FeedbackController extends Controller
{
    /** Rate a session (one per attendee; sending again edits it). Only once the session has started. */
    public function store(Request $request, ProgrammeSession $session): JsonResponse
    {
        abort_if($session->starts_at->isFuture(), 422, 'This session has not started yet.');

        $data = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'highlights' => ['nullable', 'array', 'max:5'],
            'highlights.*' => ['string', Rule::in(config('testimonies.highlights'))],
            'comment' => ['nullable', 'string', 'max:500'],
        ]);

        SessionFeedback::updateOrCreate(
            ['attendee_id' => $request->user()->id, 'programme_session_id' => $session->id],
            ['rating' => $data['rating'], 'highlights' => array_values(array_unique($data['highlights'] ?? [])), 'comment' => $data['comment'] ?? null],
        );

        return response()->json(['data' => ['session_id' => $session->id]], 201);
    }

    /** What this attendee has already answered, so prompts aren't repeated on another device. */
    public function mine(Request $request): JsonResponse
    {
        $id = $request->user()->id;

        return response()->json(['data' => [
            'session_ids' => SessionFeedback::where('attendee_id', $id)->pluck('programme_session_id'),
            'survey_completed' => SurveyResponse::where('attendee_id', $id)->exists(),
            'prompt_delay_minutes' => config('testimonies.feedback_prompt_delay_minutes'),
            'highlights' => config('testimonies.highlights'),
        ]]);
    }
}
