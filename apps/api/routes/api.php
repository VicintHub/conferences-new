<?php

use App\Http\Controllers\Api\V1\Admin\ApprovalController;
use App\Http\Controllers\Api\V1\Admin\BroadcastController;
use App\Http\Controllers\Api\V1\Admin\CheckinController;
use App\Http\Controllers\Api\V1\Admin\DeskController;
use App\Http\Controllers\Api\V1\Admin\MeController as AdminMeController;
use App\Http\Controllers\Api\V1\Admin\OrderAdminController;
use App\Http\Controllers\Api\V1\Admin\OverviewController;
use App\Http\Controllers\Api\V1\Admin\PublicityAdminController;
use App\Http\Controllers\Api\V1\Admin\RegistrantController;
use App\Http\Controllers\Api\V1\Admin\ScanController;
use App\Http\Controllers\Api\V1\Admin\SettingsController;
use App\Http\Controllers\Api\V1\Admin\StaffAdminController;
use App\Http\Controllers\Api\V1\Admin\StaffAuthController;
use App\Http\Controllers\Api\V1\Admin\TeamAdminController;
use App\Http\Controllers\Api\V1\Admin\TestimonyModerationController;
use App\Http\Controllers\Api\V1\ApplicationController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CapacityController;
use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\EventController;
use App\Http\Controllers\Api\V1\FeedbackController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\LiveController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentWebhookController;
use App\Http\Controllers\Api\V1\ProgrammeController;
use App\Http\Controllers\Api\V1\PublicityController;
use App\Http\Controllers\Api\V1\RegistrationController;
use App\Http\Controllers\Api\V1\ShopController;
use App\Http\Controllers\Api\V1\SpeakerController;
use App\Http\Controllers\Api\V1\SurveyController;
use App\Http\Controllers\Api\V1\TeamController;
use App\Http\Controllers\Api\V1\TeamMemberController;
use App\Http\Controllers\Api\V1\TestimonyController;
use App\Http\Controllers\Api\V1\TravelController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class);
    Route::get('/event', EventController::class);
    Route::get('/capacity', CapacityController::class);
    Route::get('/programme', ProgrammeController::class);
    Route::get('/speakers', [SpeakerController::class, 'index']);
    Route::get('/speakers/{slug}', [SpeakerController::class, 'show']);
    Route::get('/publicity', [PublicityController::class, 'index']);
    Route::get('/publicity/{slug}', [PublicityController::class, 'show']);
    Route::post('/publicity/{slug}/track', [PublicityController::class, 'track'])->middleware('throttle:120,1');
    Route::get('/shop/products', [ShopController::class, 'index']);
    Route::get('/shop/products/{slug}', [ShopController::class, 'show']);
    Route::post('/shop/checkout', CheckoutController::class)->middleware('throttle:10,1');
    Route::get('/shop/orders/{code}', [OrderController::class, 'show']);
    Route::post('/shop/orders/{code}/verify', [OrderController::class, 'verify'])->middleware('throttle:60,1');
    Route::post('/webhooks/paystack', [PaymentWebhookController::class, 'paystack']);
    Route::post('/shop/payments/mock/{reference}/complete', [PaymentWebhookController::class, 'mock']);
    Route::get('/testimonies', [TestimonyController::class, 'index']);
    Route::post('/testimonies', [TestimonyController::class, 'store'])->middleware('throttle:testimonies');

    Route::post('/registrations', [RegistrationController::class, 'store'])->middleware('throttle:otp');

    Route::prefix('auth')->group(function () {
        Route::post('/otp', [AuthController::class, 'otp'])->middleware('throttle:otp');
        Route::post('/verify', [AuthController::class, 'verify'])->middleware('throttle:verify');
        Route::post('/verify-link', [AuthController::class, 'verifyLink'])->middleware('throttle:verify');
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [MeController::class, 'show']);
        Route::patch('/me/registration', [MeController::class, 'updateRegistration']);
        Route::post('/auth/logout', [MeController::class, 'logout']);

        Route::put('/testimonies/{testimony}/amen', [TestimonyController::class, 'amen']);
        Route::delete('/testimonies/{testimony}/amen', [TestimonyController::class, 'unamen']);
        Route::post('/sessions/{session}/feedback', [FeedbackController::class, 'store']);
        Route::post('/shop/orders/{code}/attach', [OrderController::class, 'attach']);
        Route::get('/me/orders', [OrderController::class, 'mine']);
        Route::get('/me/feedback', [FeedbackController::class, 'mine']);
        Route::get('/me/teams/{kind}', [TeamController::class, 'show'])->whereIn('kind', ['church', 'minister']);
        Route::post('/me/teams/{kind}', [TeamController::class, 'store'])->whereIn('kind', ['church', 'minister']);
        Route::patch('/me/teams/{kind}', [TeamController::class, 'update'])->whereIn('kind', ['church', 'minister']);
        Route::post('/me/teams/{kind}/members', [TeamMemberController::class, 'store'])->whereIn('kind', ['church', 'minister'])->middleware('throttle:30,1');
        Route::post('/me/teams/church/members/import', [TeamMemberController::class, 'import'])->middleware('throttle:6,1');
        Route::delete('/me/teams/{kind}/members/{member}', [TeamMemberController::class, 'destroy'])->whereIn('kind', ['church', 'minister'])->whereNumber('member');
        Route::post('/me/teams/{kind}/members/{member}/resend', [TeamMemberController::class, 'resend'])->whereIn('kind', ['church', 'minister'])->whereNumber('member')->middleware('throttle:10,1');
        Route::delete('/me/teams/church/membership', [TeamController::class, 'leave']);
        Route::get('/teams/{code}', [TeamController::class, 'preview']);
        Route::post('/teams/{code}/join', [TeamController::class, 'join'])->middleware('throttle:20,1');
        Route::get('/me/applications', [ApplicationController::class, 'index']);
        Route::post('/me/applications', [ApplicationController::class, 'store'])->middleware('throttle:10,1');
        Route::post('/me/applications/{application}/documents', [ApplicationController::class, 'documents'])->whereNumber('application')->middleware('throttle:20,1');
        Route::get('/live', [LiveController::class, 'show']);
        Route::post('/live/heartbeat', [LiveController::class, 'heartbeat'])->middleware('throttle:6,1');
        Route::post('/sessions/{session}/remind', [LiveController::class, 'remind']);
        Route::delete('/sessions/{session}/remind', [LiveController::class, 'unremind']);
        Route::get('/travel', TravelController::class);
        Route::get('/survey', [SurveyController::class, 'show']);
        Route::post('/survey', [SurveyController::class, 'store']);
    });
    // Admin console. Staff have their own sign-in and token guard; each area is limited by role.
    Route::prefix('admin')->group(function () {
        Route::post('/auth/otp', [StaffAuthController::class, 'otp'])->middleware('throttle:otp');
        Route::post('/auth/verify', [StaffAuthController::class, 'verify'])->middleware('throttle:verify');
        Route::post('/auth/verify-link', [StaffAuthController::class, 'verifyLink'])->middleware('throttle:verify');

        Route::middleware(['auth:staff', 'staff'])->group(function () {
            Route::get('/me', AdminMeController::class);
            Route::post('/auth/logout', [StaffAuthController::class, 'logout']);
            Route::get('/overview', OverviewController::class);

            Route::middleware('staff:registrants')->group(function () {
                Route::get('/registrants', [RegistrantController::class, 'index']);
                Route::get('/registrants/export', [RegistrantController::class, 'export']);
            });
            Route::middleware('staff:approvals')->group(function () {
                Route::get('/approvals', [ApprovalController::class, 'index']);
                Route::get('/approvals/{key}', [ApprovalController::class, 'show']);
                Route::post('/approvals/{key}', [ApprovalController::class, 'decide']);
                Route::get('/applications/{application}/documents/{document}', [ApprovalController::class, 'document'])->whereNumber(['application', 'document']);
            });
            Route::middleware('staff:broadcasts')->group(function () {
                Route::get('/broadcasts', [BroadcastController::class, 'index']);
                Route::post('/broadcasts', [BroadcastController::class, 'store'])->middleware('throttle:20,1');
                Route::post('/broadcasts/preview', [BroadcastController::class, 'preview']);
                Route::post('/broadcasts/test', [BroadcastController::class, 'test'])->middleware('throttle:10,1');
                Route::post('/broadcasts/{broadcast}/cancel', [BroadcastController::class, 'cancel'])->whereNumber('broadcast');
            });
            Route::middleware('staff:testimonies')->group(function () {
                Route::get('/testimonies', [TestimonyModerationController::class, 'index']);
                Route::post('/testimonies/{testimony}', [TestimonyModerationController::class, 'update'])->whereNumber('testimony');
            });
            Route::middleware('staff:publicity')->group(function () {
                Route::get('/publicity', [PublicityAdminController::class, 'index']);
                Route::post('/publicity', [PublicityAdminController::class, 'store'])->middleware('throttle:30,1');
                Route::patch('/publicity/{item}', [PublicityAdminController::class, 'update'])->whereNumber('item');
                Route::delete('/publicity/{item}', [PublicityAdminController::class, 'destroy'])->whereNumber('item');
            });
            Route::middleware('staff:settings')->group(function () {
                Route::get('/settings', [SettingsController::class, 'show']);
                Route::put('/settings/live', [SettingsController::class, 'updateLive']);
                Route::post('/replays', [SettingsController::class, 'storeReplay']);
                Route::patch('/replays/{replay}', [SettingsController::class, 'updateReplay'])->whereNumber('replay');
                Route::delete('/replays/{replay}', [SettingsController::class, 'destroyReplay'])->whereNumber('replay');
            });
            Route::middleware('staff:staff')->group(function () {
                Route::get('/staff', [StaffAdminController::class, 'index']);
                Route::post('/staff', [StaffAdminController::class, 'store']);
                Route::patch('/staff/{staff}', [StaffAdminController::class, 'update'])->whereNumber('staff');
            });
            Route::middleware('staff:desk')->group(function () {
                Route::get('/desk/lookup', [DeskController::class, 'lookup'])->middleware('throttle:120,1');
                Route::post('/desk/print', [DeskController::class, 'print'])->middleware('throttle:60,1');
                Route::get('/desk/summary', [DeskController::class, 'summary']);
            });
            Route::middleware('staff:scan')->group(function () {
                Route::post('/scans/batch', [ScanController::class, 'batch'])->middleware('throttle:240,1');
                Route::get('/scans/roster', [ScanController::class, 'roster'])->middleware('throttle:30,1');
            });
            Route::get('/checkin', CheckinController::class)->middleware('staff:checkin');
            Route::get('/teams', [TeamAdminController::class, 'index'])->middleware('staff:teams');
            Route::middleware('staff:orders')->group(function () {
                Route::get('/orders', [OrderAdminController::class, 'index']);
                Route::patch('/orders/{code}', [OrderAdminController::class, 'update']);
            });
        });
    });
});
