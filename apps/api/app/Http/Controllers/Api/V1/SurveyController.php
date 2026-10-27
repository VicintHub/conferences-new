<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Testimonies\Models\SurveyResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SurveyController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => [
            'title' => config('survey.title'),
            'questions' => config('survey.questions'),
            'completed' => SurveyResponse::where('attendee_id', $request->user()->id)->exists(),
        ]]);
    }

    /** One submission per attendee. Answers are validated against the question list. */
    public function store(Request $request): JsonResponse
    {
        $attendeeId = $request->user()->id;
        if (SurveyResponse::where('attendee_id', $attendeeId)->exists()) {
            return response()->json(['message' => 'You have already completed this survey.', 'code' => 'already_submitted'], 409);
        }

        $rules = [];
        foreach (config('survey.questions') as $q) {
            $key = "answers.{$q['id']}";
            $presence = $q['required'] ? 'required' : 'nullable';

            switch ($q['type']) {
                case 'scale':
                    $rules[$key] = [$presence, 'integer', "between:{$q['min']},{$q['max']}"];
                    break;
                case 'ratings':
                    $rules[$key] = [$presence, 'array'];
                    foreach ($q['items'] as $item) {
                        $rules["{$key}.{$item}"] = ["required_with:{$key}", 'integer', 'between:1,5'];
                    }
                    break;
                case 'multi':
                    $rules[$key] = [$presence, 'array'];
                    $rules["{$key}.*"] = ['string', Rule::in($q['options'])];
                    break;
                default:
                    $rules[$key] = [$presence, 'string', 'max:1000'];
            }
        }
        $rules['answers'] = ['required', 'array'];

        $data = $request->validate($rules);
        $allowed = collect(config('survey.questions'))->pluck('id')->all();

        SurveyResponse::create(['attendee_id' => $attendeeId, 'answers' => collect($data['answers'])->only($allowed)->all()]);

        return response()->json(['data' => ['completed' => true]], 201);
    }
}
