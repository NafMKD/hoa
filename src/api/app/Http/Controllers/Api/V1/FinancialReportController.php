<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Repositories\Api\V1\FinancialReportRepository;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinancialReportController extends Controller
{
    public function __construct(
        protected FinancialReportRepository $reports
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    protected function validateFilters(Request $request, bool $allowBuilding): array
    {
        $rules = [
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
        ];
        if ($allowBuilding) {
            $rules['building_id'] = ['nullable', 'integer', 'exists:buildings,id'];
        }

        return $request->validate($rules);
    }

    public function incomeSummary(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewFinancialReports');
            $filters = $this->validateFilters($request, true);
            $data = $this->reports->incomeSummary($filters);

            return response()->json(['status' => self::_SUCCESS, 'data' => $data]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            return $this->jsonServerError($e, 'Financial report income summary');
        }
    }

    public function expensesByCategory(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewFinancialReports');
            $filters = $this->validateFilters($request, false);
            $data = $this->reports->expensesByCategory($filters);

            return response()->json(['status' => self::_SUCCESS, 'data' => $data]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            return $this->jsonServerError($e, 'Financial report expenses by category');
        }
    }

    public function payrollDirect(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewFinancialReports');
            $filters = $this->validateFilters($request, false);
            $data = $this->reports->payrollDirectSummary($filters);

            return response()->json(['status' => self::_SUCCESS, 'data' => $data]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            return $this->jsonServerError($e, 'Financial report payroll direct');
        }
    }

    public function payrollAgencies(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewFinancialReports');
            $filters = $this->validateFilters($request, false);
            $data = $this->reports->payrollAgencySummary($filters);

            return response()->json(['status' => self::_SUCCESS, 'data' => $data]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            return $this->jsonServerError($e, 'Financial report payroll agencies');
        }
    }

    public function profitAndLoss(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewFinancialReports');
            $filters = $this->validateFilters($request, true);
            $data = $this->reports->profitAndLoss($filters);

            return response()->json(['status' => self::_SUCCESS, 'data' => $data]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            return $this->jsonServerError($e, 'Financial report P&L');
        }
    }

    public function exportCsv(Request $request): StreamedResponse|JsonResponse
    {
        try {
            $this->authorize('viewFinancialReports');
            $filters = $this->validateFilters($request, true);
            $report = $request->query('report');
            if (! is_string($report) || $report === '') {
                return response()->json(['status' => self::_ERROR, 'message' => 'report is required.'], 400);
            }

            $allowed = [
                'income-summary',
                'expenses-by-category',
                'payroll-direct',
                'payroll-agencies',
                'profit-and-loss',
            ];
            if (! in_array($report, $allowed, true)) {
                return response()->json(['status' => self::_ERROR, 'message' => 'Invalid report type.'], 400);
            }

            $filename = 'financial-report-'.$report.'-'.$filters['date_from'].'-'.$filters['date_to'].'.csv';

            return response()->streamDownload(function () use ($report, $filters) {
                $out = fopen('php://output', 'w');
                if ($out === false) {
                    return;
                }
                fwrite($out, "\xEF\xBB\xBF");

                match ($report) {
                    'income-summary' => $this->streamIncomeSummaryCsv($out, $filters),
                    'expenses-by-category' => $this->streamExpensesCsv($out, $filters),
                    'payroll-direct' => $this->streamPayrollDirectCsv($out, $filters),
                    'payroll-agencies' => $this->streamPayrollAgenciesCsv($out, $filters),
                    'profit-and-loss' => $this->streamPnlCsv($out, $filters),
                };

                fclose($out);
            }, $filename, [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        } catch (AuthorizationException) {
            return response()->json(['status' => self::_ERROR, 'message' => self::_UNAUTHORIZED], 403);
        } catch (RepositoryException $e) {
            return response()->json(['status' => self::_ERROR, 'message' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            Log::error('Financial report CSV export: '.$e->getMessage(), ['exception' => $e]);

            return $this->jsonServerError($e, 'Financial report CSV export');
        }
    }

    /**
     * @param  resource  $out
     */
    private function streamIncomeSummaryCsv($out, array $filters): void
    {
        $data = $this->reports->incomeSummary($filters);
        fputcsv($out, ['Income summary (confirmed payments)', '', '', '']);
        fputcsv($out, ['Period from', $data['period']['date_from'], 'to', $data['period']['date_to']]);
        fputcsv($out, ['Basis', $data['basis'], '', '']);
        fputcsv($out, []);
        fputcsv($out, ['Total amount', $data['totals']['amount'], 'Payment count', $data['totals']['payment_count']]);
        fputcsv($out, []);
        fputcsv($out, ['Building ID', 'Building name', 'Total amount', 'Payment count']);
        foreach ($data['by_building'] as $row) {
            fputcsv($out, [$row['building_id'], $row['building_name'], $row['total_amount'], $row['payment_count']]);
        }
    }

    /**
     * @param  resource  $out
     */
    private function streamExpensesCsv($out, array $filters): void
    {
        $data = $this->reports->expensesByCategory($filters);
        fputcsv($out, ['Expenses by category', '', '', '', '']);
        fputcsv($out, ['Period from', $data['period']['date_from'], 'to', $data['period']['date_to']]);
        fputcsv($out, []);
        fputcsv($out, ['Total amount', $data['totals']['total_amount'], 'Line count', $data['totals']['line_count']]);
        fputcsv($out, []);
        fputcsv($out, ['Category ID', 'Name', 'Code', 'Line count', 'Total amount']);
        foreach ($data['by_category'] as $row) {
            fputcsv($out, [
                $row['expense_category_id'],
                $row['category_name'],
                $row['category_code'],
                $row['line_count'],
                $row['total_amount'],
            ]);
        }
    }

    /**
     * @param  resource  $out
     */
    private function streamPayrollDirectCsv($out, array $filters): void
    {
        $data = $this->reports->payrollDirectSummary($filters);
        fputcsv($out, ['Direct payroll (period overlap)', '', '', '', '', '', '', '']);
        fputcsv($out, ['Period from', $data['period']['date_from'], 'to', $data['period']['date_to']]);
        fputcsv($out, []);
        fputcsv($out, ['Gross', $data['totals']['gross_salary'], 'Taxes', $data['totals']['taxes'], 'Deductions', $data['totals']['deductions'], 'Net', $data['totals']['net_salary']]);
        fputcsv($out, ['Payroll rows', $data['totals']['payroll_count'], '', '', '', '', '', '']);
        fputcsv($out, []);
        fputcsv($out, ['Payroll ID', 'Employee ID', 'Employee', 'Status', 'Period start', 'Period end', 'Gross', 'Taxes', 'Deductions', 'Net']);
        foreach ($data['by_employee'] as $row) {
            fputcsv($out, [
                $row['payroll_id'],
                $row['employee_id'],
                $row['employee_name'] ?? '',
                $row['status'],
                $row['payroll_period_start'],
                $row['payroll_period_end'],
                $row['gross_salary'],
                $row['taxes'],
                $row['deductions'],
                $row['net_salary'],
            ]);
        }
    }

    /**
     * @param  resource  $out
     */
    private function streamPayrollAgenciesCsv($out, array $filters): void
    {
        $data = $this->reports->payrollAgencySummary($filters);
        fputcsv($out, ['Agency monthly payroll', '', '', '', '']);
        fputcsv($out, ['Period from', $data['period']['date_from'], 'to', $data['period']['date_to']]);
        fputcsv($out, []);
        fputcsv($out, ['Amount paid', $data['totals']['amount_paid'], 'Workers (sum)', $data['totals']['worker_count'], 'Rows', $data['totals']['payment_count']]);
        fputcsv($out, []);
        fputcsv($out, ['By agency']);
        fputcsv($out, ['Agency ID', 'Agency name', 'Amount paid', 'Workers', 'Rows']);
        foreach ($data['by_agency'] as $row) {
            fputcsv($out, [$row['agency_id'], $row['agency_name'], $row['total_amount_paid'], $row['total_worker_count'], $row['row_count']]);
        }
        fputcsv($out, []);
        fputcsv($out, ['By line of work']);
        fputcsv($out, ['Line of work', 'Amount paid', 'Workers', 'Rows']);
        foreach ($data['by_line_of_work'] as $row) {
            fputcsv($out, [$row['line_of_work'], $row['total_amount_paid'], $row['total_worker_count'], $row['row_count']]);
        }
        fputcsv($out, []);
        fputcsv($out, ['By calendar month']);
        fputcsv($out, ['Calendar month', 'Amount paid', 'Workers', 'Rows']);
        foreach ($data['by_calendar_month'] as $row) {
            fputcsv($out, [$row['calendar_month'], $row['total_amount_paid'], $row['total_worker_count'], $row['row_count']]);
        }
    }

    /**
     * @param  resource  $out
     */
    private function streamPnlCsv($out, array $filters): void
    {
        $data = $this->reports->profitAndLoss($filters);
        fputcsv($out, ['Cash P&L (income − expenses)', '', '', '']);
        fputcsv($out, ['Period from', $data['period']['date_from'], 'to', $data['period']['date_to']]);
        fputcsv($out, []);
        fputcsv($out, ['Total income (confirmed payments)', $data['totals']['total_income']]);
        fputcsv($out, ['Total expenses', $data['totals']['total_expenses']]);
        fputcsv($out, ['Net', $data['totals']['net']]);
    }
}
