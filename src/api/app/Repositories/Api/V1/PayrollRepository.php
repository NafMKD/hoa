<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Payroll;
use App\Support\PayrollMath;
use App\Support\PayrollRulesSnapshot;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class PayrollRepository
{
    public function __construct(
        protected DocumentRepository $documents,
        protected ExpenseRepository $expenses,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = Payroll::query()
            ->with(['employee', 'payslip', 'expense', 'creator', 'approver'])
            ->orderByDesc('payroll_period_end')
            ->orderByDesc('id');

        if (! empty($filters['employee_id'])) {
            $query->where('employee_id', $filters['employee_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $term = '%'.addcslashes((string) $filters['search'], '%_\\').'%';
            $query->whereHas('employee', function ($q) use ($term): void {
                $q->where('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) like ?", [$term]);
            });
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Payroll
    {
        try {
            PayrollMath::assertNetMatches(
                (float) $data['gross_salary'],
                (float) $data['taxes'],
                (float) $data['deductions'],
                (float) $data['net_salary']
            );
        } catch (\InvalidArgumentException $e) {
            throw new RepositoryException($e->getMessage());
        }

        if (isset($data['payslip']) && $data['payslip'] instanceof UploadedFile) {
            $document = $this->documents->create($data['payslip'], 'payslip');
            $data['payslip_document_id'] = $document->id;
        }

        unset($data['payslip']);

        return DB::transaction(function () use ($data) {
            return Payroll::create($data)->load(['employee', 'payslip', 'expense', 'creator', 'approver']);
        });
    }

    /**
     * @param  array<int>  $employeeIds
     * @return Collection<int, Payroll>
     */
    public function generateDirectForMonth(int $year, int $month, array $employeeIds, int $createdBy): Collection
    {
        if ($employeeIds === []) {
            throw new RepositoryException('Select at least one employee.');
        }

        $start = Carbon::create($year, $month, 1)->startOfMonth();
        $end = $start->copy()->endOfMonth();
        $snapshot = PayrollRulesSnapshot::build();
        $brackets = $snapshot['tax_brackets'];

        return DB::transaction(function () use ($employeeIds, $start, $end, $snapshot, $brackets, $createdBy) {
            $out = new Collection;

            foreach ($employeeIds as $eid) {
                $employee = Employee::query()->findOrFail((int) $eid);
                $gross = (float) $employee->gross_salary;

                $exists = Payroll::query()
                    ->where('employee_id', $employee->id)
                    ->whereDate('payroll_period_start', $start->toDateString())
                    ->exists();

                if ($exists) {
                    throw new RepositoryException(
                        sprintf(
                            'Payroll for %s %s for %s already exists.',
                            $employee->first_name,
                            $employee->last_name,
                            $start->format('Y-m')
                        )
                    );
                }

                $tax = PayrollMath::progressiveTaxOnGross($gross, $brackets);
                $deductions = PayrollMath::otherDeductions(
                    $gross,
                    $snapshot['deduction_fixed'],
                    $snapshot['deduction_percent_of_gross']
                );
                $net = PayrollMath::computeNet($gross, $tax, $deductions);

                $row = Payroll::create([
                    'employee_id' => $employee->id,
                    'payroll_period_start' => $start->toDateString(),
                    'payroll_period_end' => $end->toDateString(),
                    'gross_salary' => $gross,
                    'taxes' => $tax,
                    'deductions' => $deductions,
                    'net_salary' => $net,
                    'status' => Controller::_PAYROLL_STATUSES[0],
                    'calculation_metadata' => $snapshot,
                    'created_by' => $createdBy,
                ]);

                $out->push($row->load(['employee', 'payslip', 'expense', 'creator', 'approver']));
            }

            return $out;
        });
    }

    public function submitForReview(Payroll $payroll): Payroll
    {
        if ($payroll->status !== Controller::_PAYROLL_STATUSES[0]) {
            throw new RepositoryException('Only draft payrolls can be submitted for review.');
        }

        $payroll->status = Controller::_PAYROLL_STATUSES[1];
        $payroll->save();

        return $payroll->fresh(['employee', 'payslip', 'expense', 'creator', 'approver']);
    }

    public function approve(Payroll $payroll, int $adminUserId): Payroll
    {
        if (! in_array($payroll->status, [Controller::_PAYROLL_STATUSES[0], Controller::_PAYROLL_STATUSES[1]], true)) {
            throw new RepositoryException('Only draft or pending payrolls can be approved.');
        }

        $payroll->status = Controller::_PAYROLL_STATUSES[2];
        $payroll->approved_by = $adminUserId;
        $payroll->approved_at = now();
        $payroll->save();

        return $payroll->fresh(['employee', 'payslip', 'expense', 'creator', 'approver']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Payroll $payroll, array $data): Payroll
    {
        if (in_array($payroll->status, [Controller::_PAYROLL_STATUSES[2], Controller::_PAYROLL_STATUSES[3]], true)) {
            throw new RepositoryException('Cannot edit an approved or paid payroll.');
        }

        if (isset($data['status']) && $data['status'] === Controller::_PAYROLL_STATUSES[3]) {
            throw new RepositoryException('Use mark-as-paid to set status to paid.');
        }

        if (isset($data['payslip']) && $data['payslip'] instanceof UploadedFile) {
            if ($payroll->payslip) {
                $this->documents->delete($payroll->payslip);
            }
            $document = $this->documents->create($data['payslip'], 'payslip');
            $data['payslip_document_id'] = $document->id;
        }

        unset($data['payslip']);

        if (isset($data['gross_salary'], $data['taxes'], $data['deductions'], $data['net_salary'])) {
            try {
                PayrollMath::assertNetMatches(
                    (float) $data['gross_salary'],
                    (float) $data['taxes'],
                    (float) $data['deductions'],
                    (float) $data['net_salary']
                );
            } catch (\InvalidArgumentException $e) {
                throw new RepositoryException($e->getMessage());
            }
        }

        return DB::transaction(function () use ($payroll, $data) {
            $payroll->update($data);

            return $payroll->fresh(['employee', 'payslip', 'expense', 'creator', 'approver']);
        });
    }

    public function markPaid(
        Payroll $payroll,
        string $payDateYmd,
        ?UploadedFile $payslip,
        int $userId,
        bool $linkExpense = true,
    ): Payroll {
        if ($payroll->status === Controller::_PAYROLL_STATUSES[3]) {
            throw new RepositoryException('Payroll is already marked paid.');
        }

        if ($payroll->status !== Controller::_PAYROLL_STATUSES[2]) {
            throw new RepositoryException('Payroll must be approved before marking paid.');
        }

        try {
            PayrollMath::assertNetMatches(
                (float) $payroll->gross_salary,
                (float) $payroll->taxes,
                (float) $payroll->deductions,
                (float) $payroll->net_salary
            );
        } catch (\InvalidArgumentException $e) {
            throw new RepositoryException($e->getMessage());
        }

        $this->assertNoOverlappingPaidPayroll($payroll);

        return DB::transaction(function () use ($payroll, $payDateYmd, $payslip, $userId, $linkExpense) {
            $payroll->refresh();

            if ($payslip instanceof UploadedFile) {
                if ($payroll->payslip) {
                    $this->documents->delete($payroll->payslip);
                }
                $document = $this->documents->create($payslip, 'payslip');
                $payroll->payslip_document_id = $document->id;
            }

            $payroll->pay_date = $payDateYmd;
            $payroll->status = Controller::_PAYROLL_STATUSES[3];
            $payroll->save();

            if ($linkExpense) {
                /** @var Employee $employee */
                $employee = $payroll->employee()->firstOrFail();

                $description = sprintf(
                    'Direct payroll — %s %s — %s to %s',
                    $employee->first_name,
                    $employee->last_name,
                    $payroll->payroll_period_start->format('Y-m-d'),
                    $payroll->payroll_period_end->format('Y-m-d')
                );

                $expense = $this->expenses->createPayrollLinkedExpense(
                    $description,
                    (float) $payroll->net_salary,
                    $payDateYmd,
                    $userId
                );

                $payroll->expense_id = $expense->id;
                $payroll->save();
            }

            return $payroll->fresh(['employee', 'payslip', 'expense', 'creator', 'approver']);
        });
    }

    public function delete(Payroll $payroll): void
    {
        if ($payroll->status !== Controller::_PAYROLL_STATUSES[0]) {
            throw new RepositoryException('Only draft payrolls can be deleted.');
        }

        DB::transaction(function () use ($payroll) {
            $payroll->delete();
        });
    }

    private function assertNoOverlappingPaidPayroll(Payroll $payroll): void
    {
        $overlap = Payroll::query()
            ->where('employee_id', $payroll->employee_id)
            ->where('status', Controller::_PAYROLL_STATUSES[3])
            ->where('id', '!=', $payroll->id)
            ->whereDate('payroll_period_start', '<=', $payroll->payroll_period_end)
            ->whereDate('payroll_period_end', '>=', $payroll->payroll_period_start)
            ->exists();

        if ($overlap) {
            throw new RepositoryException(
                'Another paid payroll already overlaps this period for this employee.'
            );
        }
    }
}
