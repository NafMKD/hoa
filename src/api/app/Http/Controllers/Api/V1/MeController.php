<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\InvoiceResource;
use App\Repositories\Api\V1\InvoiceRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class MeController extends Controller
{
    protected InvoiceRepository $invoices;

    /**
     * MeController constructor.
     *
     * @param InvoiceRepository $invoices
     */
    public function __construct(InvoiceRepository $invoices)
    {
        $this->invoices = $invoices;
    }

    /**
     * Get the authenticated user's invoices.
     *
     * @param Request $request
     * @return AnonymousResourceCollection|JsonResponse
     */
    public function invoices(Request $request): AnonymousResourceCollection|JsonResponse
    {
        try {
            $validated = $request->validate([
                'status'   => ['nullable', 'string', Rule::in(['pending', 'paid', 'all'])],
                'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
                'page'     => ['nullable', 'integer', 'min:1'],
                // scope=user: invoices for this user only (default)
                // scope=unit: invoices for units where this user is current owner or tenant
                'scope'    => ['nullable', 'string', Rule::in(['user', 'unit'])],
            ]);

            $filters = [
                'status'   => $validated['status'] ?? 'all',
                'per_page' => $validated['per_page'] ?? self::_DEFAULT_PAGINATION,
            ];

            $scope = $validated['scope'] ?? 'user';

            if ($scope === 'unit') {
                $invoices = $this->invoices->forUserUnits($request->user(), $filters);
            } else {
                $invoices = $this->invoices->forUser($request->user(), $filters);
            }

            $invoices->load(['user', 'unit', 'unit.currentOwner', 'source', 'penalties', 'payments']);

            return InvoiceResource::collection($invoices);
        } catch (\Exception $e) {
            Log::error('Error fetching user invoices: ' . $e->getMessage());
            return response()->json([
                'status'  => self::_ERROR,
                'message' => self::_UNKNOWN_ERROR,
            ], 400);
        }
    }
}
