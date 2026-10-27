<?php

return [
    'name' => '37th IMLC & IYLC',
    'organiser' => 'The Men of Issachar Vision Inc.',
    'starts_at' => env('CONFERENCE_STARTS_AT', '2027-01-19T17:00:00+01:00'),
    'ends_at' => env('CONFERENCE_ENDS_AT', '2027-01-24T23:59:00+01:00'),
    'venue' => 'Leadership & Missions Conference Centre, Olororo, Ojoo, Ibadan, Nigeria',
    'onsite_capacity' => (int) env('CONFERENCE_ONSITE_CAPACITY', 2500),
    // Where the venue is, for directions and the map. From the church's Google Maps listing (plus code FW66+PXX, Alaka).
    'venue_lat' => (float) env('CONFERENCE_VENUE_LAT', 7.461863),
    'venue_lng' => (float) env('CONFERENCE_VENUE_LNG', 3.912484),
    'give_url' => env('CONFERENCE_GIVE_URL'),
    'hotel_rate_code' => env('CONFERENCE_HOTEL_RATE_CODE', 'JANCONF27'),
    'team_max' => (int) env('CONFERENCE_TEAM_MAX', 50),
    'minister_aides_max' => 3,
    // Headline for each day, shown in "The week" on the desktop dashboard.
    'day_titles' => [
        '2027-01-19' => 'Evening of Worship',
        '2027-01-20' => 'IMLC Day 1',
        '2027-01-21' => 'IMLC Day 2',
        '2027-01-22' => 'IMLC Day 3',
        '2027-01-23' => 'Royal Conf. + IYLC',
        '2027-01-24' => 'IMLC Closing',
    ],
];
