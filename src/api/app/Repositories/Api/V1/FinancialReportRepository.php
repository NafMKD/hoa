<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\AgencyMonthlyPayment;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Payroll;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinancialReportRepository
{
    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    public function parseDateRange(string $dateFrom, string $dateTo): array
    {
        $from = Carbon::parse($dateFrom)->startOfDay();
        $to = Carbon::parse($dateTo)->endOfDay();
        if ($from->gt($to)) {
            throw new RepositoryException('date_from must be before or equal to date_to.');
        }

        return [$from, $to];
    }

    /**
     * Cash-basis income: confirmed payments whose payment_date falls in the range.
     *
     * @param  array{date_from: string, date_to: string, building_id?: int|null}  $filters
     * @return array<string, mixed>
     */
    public function incomeSummary(array $filters): array
    {
        [$from, $to] = $this->parseDateRange($filters['date_from'], $filters['date_to']);
        $buildingId = $filters['building_id'] ?? null;

        $base = Payment::query()
            ->where('status', Controller::_PAYMENT_STATUSES[1])
            ->whereDate('payment_date', '>=', $from->toDateString())
            ->whereDate('payment_date', '<=', $to->toDateString());

        if ($buildingId) {
            $base->whereHas('invoice.unit', fn ($q) => $q->where('building_id', $buildingId));
        }

        $totals = [
            'amount' => round((float) (clone $base)->sum('amount'), 2),
            'payment_count' => (clone $base)->count(),
        ];

        $byBuilding = Payment::query()
            ->select([
                'buildings.id as building_id',
                'buildings.name as building_name',
            ])
            ->selectRaw('SUM(payments.amount) as total_amount')
            ->selectRaw('COUNT(payments.id) as payment_count')
            ->join('invoices', function ($join) {
                $join->on('payments.invoice_id', '=', 'invoices.id')
                    ->whereNull('invoices.deleted_at');
            })
            ->join('units', function ($join) {
                $join->on('invoices.unit_id', '=', 'units.id')
                    ->whereNull('units.deleted_at');
            })
            ->join('buildings', function ($join) {
                $join->on('units.building_id', '=', 'buildings.id')
                    ->whereNull('buildings.deleted_at');
            })
            ->where('payments.status', Controller::_PAYMENT_STATUSES[1])
            ->whereDate('payments.payment_date', '>=', $from->toDateString())
            ->whereDate('payments.payment_date', '<=', $to->toDateString())
            ->groupBy('buildings.id', 'buildings.name')
            ->orderBy('buildings.name');

        if ($buildingId) {
            $byBuilding->where('buildings.id', $buildingId);
        }

        $rows = $byBuilding->get()->map(fn ($r) => [
            'building_id' => (int) $r->building_id,
            'building_name' => (string) $r->building_name,
            'total_amount' => round((float) $r->total_amount, 2),
            'payment_count' => (int) $r->payment_count,
        ])->values()->all();

        return [
            'period' => [
                'date_from' => $from->toDateString(),
                'date_to' => $to->toDateString(),
            ],
            'basis' => 'cash',
            'payment_status' => Controller::_PAYMENT_STATUSES[1],
            'totals' => $totals,
            'by_building' => $rows,
        ];
    }

    /**
     * Expense totals grouped by category (expense_date in range).
     *
     * @param  array{date_from: string, date_to: string}  $filters
     * @return array<string, mixed>
     */
    public function expensesByCategory(array $filters): array
    {
        [$from, $to] = $this->parseDateRange($filters['date_from'], $filters['date_to']);

        $aggregates = Expense::query()
            ->select([
                'expense_categories.id as expense_category_id',
                'expense_categories.name as category_name',
                'expense_categories.code as category_code',
            ])
            ->selectRaw('COUNT(expenses.id) as line_count')
            ->selectRaw('SUM(expenses.amount) as total_amount')
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->whereDate('expenses.expense_date', '>=', $from->toDateString())
            ->whereDate('expenses.expense_date', '<=', $to->toDateString())
            ->groupBy('expense_categories.id', 'expense_categories.name', 'expense_categories.code')
            ->orderBy('expense_categories.name')
            ->get();

        $byCategory = $aggregates->map(fn ($r) => [
            'expense_category_id' => (int) $r->expense_category_id,
            'category_name' => (string) $r->category_name,
            'category_code' => (string) $r->category_code,
            'line_count' => (int) $r->line_count,
            'total_amount' => round((float) $r->total_amount, 2),
        ])->values()->all();

        $totalsRow = Expense::query()
            ->whereDate('expense_date', '>=', $from->toDateString())
            ->whereDate('expense_date', '<=', $to->toDateString())
            ->selectRaw('COALESCE(SUM(amount), 0) as total_amount')
            ->selectRaw('COUNT(*) as line_count')
            ->first();

        $totalAmount = round((float) ($totalsRow->total_amount ?? 0), 2);
        $lineCount = (int) ($totalsRow->line_count ?? 0);

        return [
            'period' => [
                'date_from' => $from->toDateString(),
                'date_to' => $to->toDateString(),
            ],
            'basis' => 'cash',
            'totals' => [
                'total_amount' => $totalAmount,
                'line_count' => $lineCount,
            ],
            'by_category' => $byCategory,
        ];
    }

    /**
     * Direct payroll rows whose pay period overlaps the selected date range.
     *
     * @param  array{date_from: string, date_to: string}  $filters
     * @return array<string, mixed>
     */
    public function payrollDirectSummary(array $filters): array
    {
        [$from, $to] = $this->parseDateRange($filters['date_from'], $filters['date_to']);

        $base = Payroll::query()
            ->whereDate('payroll_period_start', '<=', $to->toDateString())
            ->whereDate('payroll_period_end', '>=', $from->toDateString());

        $totals = [
            'gross_salary' => round((float) (clone $base)->sum('gross_salary'), 2),
            'taxes' => round((float) (clone $base)->sum('taxes'), 2),
            'deductions' => round((float) (clone $base)->sum('deductions'), 2),
            'net_salary' => round((float) (clone $base)->sum('net_salary'), 2),
            'payroll_count' => (clone $base)->count(),
        ];

        $byEmployee = Payroll::query()
            ->with('employee')
            ->whereDate('payroll_period_start', '<=', $to->toDateString())
            ->whereDate('payroll_period_end', '>=', $from->toDateString())
            ->orderBy('id')
            ->get()
            ->map(function (Payroll $p) {
                $e = $p->employee;

                return [
                    'payroll_id' => $p->id,
                    'employee_id' => $p->employee_id,
                    'employee_name' => $e ? trim($e->first_name.' '.$e->last_name) : null,
                    'status' => $p->status,
                    'payroll_period_start' => $p->payroll_period_start?->toDateString(),
                    'payroll_period_end' => $p->payroll_period_end?->toDateString(),
                    'gross_salary' => round((float) $p->gross_salary, 2),
                    'taxes' => round((float) $p->taxes, 2),
                    'deductions' => round((float) $p->deductions, 2),
                    'net_salary' => round((float) $p->net_salary, 2),
                ];
            })->values()->all();

        return [
            'period' => [
                'date_from' => $from->toDateString(),
                'date_to' => $to->toDateString(),
            ],
            'basis' => 'payroll_period_overlap',
            'totals' => $totals,
            'by_employee' => $byEmployee,
        ];
    }

    /**
     * Agency monthly payments with calendar_month in range (month-level rows).
     *
     * @param  array{date_from: string, date_to: string}  $filters
     * @return array<string, mixed>
     */
    public function payrollAgencySummary(array $filters): array
    {
        [$from, $to] = $this->parseDateRange($filters['date_from'], $filters['date_to']);
        $monthFrom = Carbon::parse($filters['date_from'])->startOfMonth()->toDateString();
        $monthTo = Carbon::parse($filters['date_to'])->startOfMonth()->toDateString();

        $base = AgencyMonthlyPayment::query()
            ->whereDate('calendar_month', '>=', $monthFrom)
            ->whereDate('calendar_month', '<=', $monthTo);

        $totals = [
            'amount_paid' => round((float) (clone $base)->sum('amount_paid'), 2),
            'worker_count' => (int) (clone $base)->sum('worker_count'),
            'payment_count' => (clone $base)->count(),
        ];

        $byAgency = AgencyMonthlyPayment::query()
            ->select([
                'agencies.id as agency_id',
                'agencies.name as agency_name',
            ])
            ->selectRaw('SUM(agency_monthly_payments.amount_paid) as total_amount_paid')
            ->selectRaw('SUM(agency_monthly_payments.worker_count) as total_worker_count')
            ->selectRaw('COUNT(agency_monthly_payments.id) as row_count')
            ->join('agencies', 'agency_monthly_payments.agency_id', '=', 'agencies.id')
            ->whereDate('agency_monthly_payments.calendar_month', '>=', $monthFrom)
            ->whereDate('agency_monthly_payments.calendar_month', '<=', $monthTo)
            ->groupBy('agencies.id', 'agencies.name')
            ->orderBy('agencies.name')
            ->get()
            ->map(fn ($r) => [
                'agency_id' => (int) $r->agency_id,
                'agency_name' => (string) $r->agency_name,
                'total_amount_paid' => round((float) $r->total_amount_paid, 2),
                'total_worker_count' => (int) $r->total_worker_count,
                'row_count' => (int) $r->row_count,
            ])->values()->all();

        $lineExpr = 'COALESCE(agency_placements.line_of_work, \'unassigned\')';

        $byLine = DB::table('agency_monthly_payments')
            ->leftJoin('agency_placements', function ($join) {
                $join->on('agency_monthly_payments.placement_id', '=', 'agency_placements.id')
                    ->whereNull('agency_placements.deleted_at');
            })
            ->whereNull('agency_monthly_payments.deleted_at')
            ->whereDate('agency_monthly_payments.calendar_month', '>=', $monthFrom)
            ->whereDate('agency_monthly_payments.calendar_month', '<=', $monthTo)
            ->selectRaw($lineExpr.' as line_of_work')
            ->selectRaw('SUM(agency_monthly_payments.amount_paid) as total_amount_paid')
            ->selectRaw('SUM(agency_monthly_payments.worker_count) as total_worker_count')
            ->selectRaw('COUNT(agency_monthly_payments.id) as row_count')
            ->groupBy(DB::raw($lineExpr))
            ->orderBy('line_of_work')
            ->get()
            ->map(fn ($r) => [
                'line_of_work' => (string) $r->line_of_work,
                'total_amount_paid' => round((float) $r->total_amount_paid, 2),
                'total_worker_count' => (int) $r->total_worker_count,
                'row_count' => (int) $r->row_count,
            ])->values()->all();

        $byMonth = AgencyMonthlyPayment::query()
            ->select('calendar_month')
            ->selectRaw('SUM(amount_paid) as total_amount_paid')
            ->selectRaw('SUM(worker_count) as total_worker_count')
            ->selectRaw('COUNT(*) as row_count')
            ->whereDate('calendar_month', '>=', $monthFrom)
            ->whereDate('calendar_month', '<=', $monthTo)
            ->groupBy('calendar_month')
            ->orderBy('calendar_month')
            ->get()
            ->map(function ($r) {
                $cm = $r->calendar_month;
                $cmStr = $cm instanceof Carbon ? $cm->toDateString() : (string) $cm;

                return [
                    'calendar_month' => $cmStr,
                    'total_amount_paid' => round((float) $r->total_amount_paid, 2),
                    'total_worker_count' => (int) $r->total_worker_count,
                    'row_count' => (int) $r->row_count,
                ];
            })->values()->all();

        return [
            'period' => [
                'date_from' => $from->toDateString(),
                'date_to' => $to->toDateString(),
            ],
            'calendar_month_bounds' => [
                'first_month' => $monthFrom,
                'last_month' => $monthTo,
            ],
            'basis' => 'calendar_month',
            'totals' => $totals,
            'by_agency' => $byAgency,
            'by_line_of_work' => $byLine,
            'by_calendar_month' => $byMonth,
        ];
    }

    /**
     * Simple cash P&amp;L: confirmed payment income minus expenses by expense_date.
     *
     * @param  array{date_from: string, date_to: string, building_id?: int|null}  $filters
     * @return array<string, mixed>
     */
    public function profitAndLoss(array $filters): array
    {
        $income = $this->incomeSummary($filters);
        $expenses = $this->expensesByCategory($filters);

        $totalIncome = $income['totals']['amount'];
        $totalExpenses = $expenses['totals']['total_amount'];
        $net = round($totalIncome - $totalExpenses, 2);

        return [
            'period' => $income['period'],
            'basis' => 'cash',
            'totals' => [
                'total_income' => $totalIncome,
                'total_expenses' => $totalExpenses,
                'net' => $net,
            ],
            'income' => $income,
            'expenses' => $expenses,
        ];
    }
}
