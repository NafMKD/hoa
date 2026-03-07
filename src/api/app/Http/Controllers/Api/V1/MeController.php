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
            ]);

            $filters = [
                'status'   => $validated['status'] ?? 'all',
                'per_page' => $validated['per_page'] ?? self::_DEFAULT_PAGINATION,
            ];

            $invoices = $this->invoices->forUser($request->user(), $filters);
            $invoices->load(['user', 'unit', 'source', 'penalties', 'payments']);

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
