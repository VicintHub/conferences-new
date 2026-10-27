<?php

/** Whole-conference survey shown in the app's Feedback tab (placeholder questions; the committee can edit this list). */
return [
    'title' => 'Help us plan IMLC 2028',
    'questions' => [
        ['id' => 'attend_next_year', 'type' => 'scale', 'required' => true, 'text' => 'How likely are you to attend next year?', 'min' => 1, 'max' => 5, 'low' => 'Not likely', 'high' => 'Definitely'],
        ['id' => 'ratings', 'type' => 'ratings', 'required' => true, 'text' => 'Rate these', 'items' => ['Registration', 'Venue & seating', 'Meals', 'Livestream']],
        ['id' => 'keep', 'type' => 'multi', 'required' => false, 'text' => 'What should we keep?', 'options' => ['The word', 'Worship', 'Prayer time', 'Breakout sessions', 'Livestream', 'Radio']],
        ['id' => 'improve', 'type' => 'text', 'required' => false, 'text' => 'What should we improve?'],
        ['id' => 'other', 'type' => 'text', 'required' => false, 'text' => 'Anything else you would like to tell us?'],
    ],
];
