<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PayrollTaxBracketResource;
use App\Models\PayrollTaxBracket;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PayrollTaxBracketController extends Controller
{
    public function index(): JsonResponse
    {
        try {
            $this->authorize('viewAny', PayrollTaxBracket::class);

            $rows = PayrollTaxBracket::query()->orderBy('sort_order')->orderBy('id')->get();

            return response()->json(PayrollTaxBracketResource::collection($rows));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error listing tax brackets: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $this->authorize('create', PayrollTaxBracket::class);

            $validated = $request->validate([
                'min_inclusive' => ['required', 'numeric', 'min:0'],
                'max_inclusive' => ['nullable', 'numeric', 'min:0'],
                'rate_percent' => ['required', 'numeric', 'min:0', 'max:100'],
                'sort_order' => ['sometimes', 'integer', 'min:0'],
            ]);

            $row = PayrollTaxBracket::create($validated);

            return response()->json(new PayrollTaxBracketResource($row), 201);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating tax bracket: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function update(Request $request, PayrollTaxBracket $payroll_tax_bracket): JsonResponse
    {
        try {
            $this->authorize('update', $payroll_tax_bracket);

            $validated = $request->validate([
                'min_inclusive' => ['sometimes', 'numeric', 'min:0'],
                'max_inclusive' => ['nullable', 'numeric', 'min:0'],
                'rate_percent' => ['sometimes', 'numeric', 'min:0', 'max:100'],
                'sort_order' => ['sometimes', 'integer', 'min:0'],
            ]);

            $payroll_tax_bracket->update($validated);

            return response()->json(new PayrollTaxBracketResource($payroll_tax_bracket->fresh()));
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error updating tax bracket: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }

    public function destroy(PayrollTaxBracket $payroll_tax_bracket): JsonResponse
    {
        try {
            $this->authorize('delete', $payroll_tax_bracket);
            $payroll_tax_bracket->delete();

            return response()->json(['status' => self::_SUCCESS, 'message' => 'Tax bracket deleted.']);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Exception $e) {
            Log::error('Error deleting tax bracket: '.$e->getMessage());

            return response()->json(['status' => self::_ERROR, 'message' => self::_UNKNOWN_ERROR], 400);
        }
    }
}
