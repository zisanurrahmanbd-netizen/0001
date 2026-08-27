<?php

namespace App\Http\Controllers;

use App\Services\DashboardMetricService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardMetricService $metricService
    ) {}

    public function index(Request $request): View
    {
        $metrics = $this->metricService->getMetrics($request->user());

        return view('dashboard.index', compact('metrics'));
    }

    public function metricsJson(Request $request): JsonResponse
    {
        $metrics = $this->metricService->getMetrics($request->user());

        return response()->json($metrics);
    }
}
