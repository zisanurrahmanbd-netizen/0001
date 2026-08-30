<?php

use App\Http\Controllers\AgentTrackingController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BankContactController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\CaseRemarkController;
use App\Http\Controllers\CheckInController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExcelImportController;
use App\Http\Controllers\GoogleSheetSyncController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Guest Authentication Routes
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->name('login.submit');
});

/*
|--------------------------------------------------------------------------
| Authenticated System Routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'active'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/', fn() => redirect()->route('dashboard'));

    // Dashboard & Live Metrics
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/api/dashboard/metrics', [DashboardController::class, 'metricsJson'])->name('api.dashboard.metrics');

    // Quick single-box search
    Route::get('/quick-search', [CaseController::class, 'quickSearch'])->name('quick-search');

    // Case Tracking & Management (Enforced at query level & route level)
    Route::get('/cases', [CaseController::class, 'index'])->name('cases.index');
    Route::get('/cases/export', [CaseController::class, 'export'])->name('cases.export');
    Route::get('/cases/{id}', [CaseController::class, 'show'])->name('cases.show');

    Route::middleware('role:admin|manager')->group(function () {
        Route::get('/cases/{id}/edit', [CaseController::class, 'edit'])->name('cases.edit');
        Route::put('/cases/{id}', [CaseController::class, 'update'])->name('cases.update');
        Route::post('/cases/{id}/reassign', [CaseController::class, 'reassign'])->name('cases.reassign');
    });

    // Check-in, Remarks & Collection Recording (Field Agents & Managers)
    Route::post('/cases/{id}/check-in', [CheckInController::class, 'store'])->name('cases.check-in');
    Route::post('/cases/{id}/remarks', [CaseRemarkController::class, 'store'])->name('cases.remarks.store');
    Route::post('/cases/{id}/collections', [CollectionController::class, 'store'])->name('cases.collections');

    // Live GPS Map & Agent Tracking
    Route::middleware('role:admin|manager')->group(function () {
        Route::get('/tracking/map', [AgentTrackingController::class, 'mapView'])->name('tracking.map');
        Route::get('/api/agent/live-locations', [AgentTrackingController::class, 'liveLocationsJson'])->name('api.agent.live-locations');
    });

    // Silent background location ping endpoint for logged-in agents
    Route::post('/agent/ping-location', [AgentTrackingController::class, 'pingLocation'])->name('agent.ping-location');
    Route::post('/api/agent/ping-location', [AgentTrackingController::class, 'pingLocation'])->name('api.agent.ping-location');

    // Excel Import System (Admin only)
    Route::middleware('role:admin')->group(function () {
        Route::get('/imports', [ExcelImportController::class, 'index'])->name('imports.index');
        Route::post('/imports/inspect', [ExcelImportController::class, 'inspect'])->name('imports.inspect');
        Route::post('/imports/preview', [ExcelImportController::class, 'preview'])->name('imports.preview');
        Route::post('/imports', [ExcelImportController::class, 'store'])->name('imports.store');
        Route::get('/imports/{job}/status', [ExcelImportController::class, 'jobStatus'])->name('imports.job-status');
    });

    // Google Sheet Bi-Directional Live Sync (Admin & Manager)
    Route::middleware('role:admin|manager')->group(function () {
        Route::get('/sync/google-sheet', [GoogleSheetSyncController::class, 'index'])->name('google-sheet.index');
        Route::post('/sync/google-sheet/inspect', [GoogleSheetSyncController::class, 'inspect'])->name('google-sheet.inspect');
        Route::post('/sync/google-sheet/sync', [GoogleSheetSyncController::class, 'sync'])->name('google-sheet.sync');
        Route::post('/sync/google-sheet/push', [GoogleSheetSyncController::class, 'pushUpdates'])->name('google-sheet.push');
    });

    // Reporting
    Route::get('/reports/agent-performance', [ReportController::class, 'agentPerformance'])->name('reports.agent-performance');
    Route::get('/reports/expiry-tracker', [ReportController::class, 'expiryTracker'])->name('reports.expiry-tracker');
    Route::get('/reports/flagged-status', [ReportController::class, 'flaggedStatus'])->name('reports.flagged-status');

    // Bank Contacts Directory
    Route::get('/contacts', [BankContactController::class, 'index'])->name('contacts.index');
    Route::middleware('role:admin|manager')->group(function () {
        Route::post('/contacts', [BankContactController::class, 'store'])->name('contacts.store');
        Route::put('/contacts/{id}', [BankContactController::class, 'update'])->name('contacts.update');
    });
    Route::middleware('role:admin')->group(function () {
        Route::delete('/contacts/{id}', [BankContactController::class, 'destroy'])->name('contacts.destroy');
    });

    // User Management (Admin & Manager)
    Route::middleware('role:admin|manager')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
    });
    Route::middleware('role:admin')->group(function () {
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');
        Route::patch('/users/{id}/toggle-status', [UserController::class, 'toggleStatus'])->name('users.toggle-status');
    });
});

/*
|--------------------------------------------------------------------------
| Public Google Apps Script Webhook Endpoint (No CSRF)
|--------------------------------------------------------------------------
*/
Route::post('/api/sync/google-sheet/webhook', [GoogleSheetSyncController::class, 'webhook'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
    ->name('api.google-sheet.webhook');
