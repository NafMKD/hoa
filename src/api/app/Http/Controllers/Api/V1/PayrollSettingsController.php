<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PayrollSetting;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PayrollSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        try {
            $this->authorize('viewAny', PayrollSetting::class);

            return response()->json([
                'deduction_fixed' => PayrollSetting::getFloat('deduction_fixed'),
                'deduction_percent_of_gross' => PayrollSetting::getFloat('deduction_percent_of_gross'),
            ]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (\Throwable $e) {
            return $this->jsonServerError($e, 'Error reading payroll settings');
        }
    }

    public function update(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', PayrollSetting::class);

            $validated = $request->validate([
                'deduction_fixed' => ['required', 'numeric', 'min:0'],
                'deduction_percent_of_gross' => ['required', 'numeric', 'min:0', 'max:100'],
            ]);

            PayrollSetting::putFloat('deduction_fixed', (float) $validated['deduction_fixed']);
            PayrollSetting::putFloat('deduction_percent_of_gross', (float) $validated['deduction_percent_of_gross']);

            return response()->json([
                'deduction_fixed' => PayrollSetting::getFloat('deduction_fixed'),
                'deduction_percent_of_gross' => PayrollSetting::getFloat('deduction_percent_of_gross'),
            ]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (ValidationException $e) {
            return response()->json([
                'status' => self::_ERROR,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            return $this->jsonServerError($e, 'Error updating payroll settings');
        }
    }
}
