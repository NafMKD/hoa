<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\AgencyMonthlyPayment;
use App\Models\AgencyPlacement;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AgencyMonthlyPaymentRepository
{
    public function __construct(
        protected ExpenseRepository $expenses,
        protected AgencyPlacementRepository $placements,
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function all(?int $perPage = null, array $filters = []): Collection|LengthAwarePaginator
    {
        $query = AgencyMonthlyPayment::query()
            ->with(['agency', 'placement', 'expense', 'creator', 'approver'])
            ->orderByDesc('calendar_month')
            ->orderByDesc('id');

        if (! empty($filters['agency_id'])) {
            $query->where('agency_id', $filters['agency_id']);
        }

        if (! empty($filters['calendar_month'])) {
            $query->whereDate('calendar_month', $filters['calendar_month']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): AgencyMonthlyPayment
    {
        $duplicate = AgencyMonthlyPayment::query()
            ->where('agency_id', $data['agency_id'])
            ->whereDate('calendar_month', $data['calendar_month'])
            ->exists();

        if ($duplicate) {
            throw new RepositoryException('A payment for this agency and calendar month already exists.');
        }

        return DB::transaction(function () use ($data) {
            return AgencyMonthlyPayment::create($data)->load(['agency', 'placement', 'expense', 'creator', 'approver']);
        });
    }

    /**
     * Draft rows for each agency that has default monthly amount and worker count configured.
     * Worker headcount is the sum of {@see AgencyPlacement::workers_count} across all placements
     * active in the calendar month; when none exist, {@see Agency::$default_worker_count} is used.
     * {@see AgencyMonthlyPayment::$placement_id} is set only when exactly one such placement exists.
     *
     * @return Collection<int, AgencyMonthlyPayment>
     */
    public function generateDraftForMonth(string $calendarMonthFirstDayYmd, int $createdBy): Collection
    {
        $monthStart = Carbon::parse($calendarMonthFirstDayYmd)->startOfMonth();
        $monthDateStr = $monthStart->toDateString();

        $placements = $this->placements->activeForCalendarMonth($monthDateStr);
        /** @var array<int, list<AgencyPlacement>> $placementsByAgencyId */
        $placementsByAgencyId = [];
        foreach ($placements as $placement) {
            $placementsByAgencyId[$placement->agency_id][] = $placement;
        }

        return DB::transaction(function () use ($placementsByAgencyId, $monthDateStr, $createdBy) {
            $out = new Collection;

            $agencies = Agency::query()
                ->whereNotNull('default_monthly_amount')
                ->where('default_monthly_amount', '>', 0)
                ->whereNotNull('default_worker_count')
                ->where('default_worker_count', '>=', 1)
                ->orderBy('id')
                ->get();

            foreach ($agencies as $agency) {
                $duplicate = AgencyMonthlyPayment::query()
                    ->where('agency_id', $agency->id)
                    ->whereDate('calendar_month', $monthDateStr)
                    ->exists();

                if ($duplicate) {
                    continue;
                }

                $agencyPlacements = $placementsByAgencyId[$agency->id] ?? [];
                $placementIds = array_map(static fn ($p) => $p->id, $agencyPlacements);
                $placementWorkerSum = array_sum(array_map(static fn ($p) => (int) $p->workers_count, $agencyPlacements));

                if (count($agencyPlacements) === 1) {
                    $placementId = $agencyPlacements[0]->id;
                } else {
                    $placementId = null;
                }

                if (count($agencyPlacements) > 0) {
                    $workerCount = $placementWorkerSum;
                } else {
                    $workerCount = (int) $agency->default_worker_count;
                }

                $metadata = [
                    'default_monthly_amount' => (float) $agency->default_monthly_amount,
                    'default_worker_count' => (int) $agency->default_worker_count,
                    'workers_from_placements' => $placementWorkerSum,
                    'placement_ids' => $placementIds,
                    'placement_id' => $placementId,
                    'workers_count_source' => count($agencyPlacements) > 0 ? 'placements' : 'agency_default',
                    'captured_at' => now()->toIso8601String(),
                ];

                $row = AgencyMonthlyPayment::create([
                    'agency_id' => $agency->id,
                    'calendar_month' => $monthDateStr,
                    'amount_paid' => (float) $agency->default_monthly_amount,
                    'worker_count' => $workerCount,
                    'placement_id' => $placementId,
                    'status' => Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[0],
                    'generation_metadata' => $metadata,
                    'created_by' => $createdBy,
                ]);

                $out->push($row->load(['agency', 'placement', 'expense', 'creator', 'approver']));
            }

            return $out;
        });
    }

    public function submitForReview(AgencyMonthlyPayment $payment): AgencyMonthlyPayment
    {
        if ($payment->status !== Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[0]) {
            throw new RepositoryException('Only draft agency payments can be submitted for review.');
        }

        $payment->status = Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[1];
        $payment->save();

        return $payment->fresh(['agency', 'placement', 'expense', 'creator', 'approver']);
    }

    public function approve(AgencyMonthlyPayment $payment, int $adminUserId): AgencyMonthlyPayment
    {
        if (! in_array($payment->status, [Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[0], Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[1]], true)) {
            throw new RepositoryException('Only draft or pending agency payments can be approved.');
        }

        $payment->status = Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[2];
        $payment->approved_by = $adminUserId;
        $payment->approved_at = now();
        $payment->save();

        return $payment->fresh(['agency', 'placement', 'expense', 'creator', 'approver']);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(AgencyMonthlyPayment $payment, array $data): AgencyMonthlyPayment
    {
        if (in_array($payment->status, [Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[2], Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[3]], true)) {
            throw new RepositoryException('Cannot edit an approved or paid agency payment.');
        }

        if (isset($data['status']) && $data['status'] === Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[3]) {
            throw new RepositoryException('Use mark-as-paid to set status to paid.');
        }

        return DB::transaction(function () use ($payment, $data) {
            $payment->update($data);

            return $payment->fresh(['agency', 'placement', 'expense', 'creator', 'approver']);
        });
    }

    public function markPaid(
        AgencyMonthlyPayment $payment,
        string $payDateYmd,
        int $userId,
        bool $linkExpense = true,
    ): AgencyMonthlyPayment {
        if ($payment->status === Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[3]) {
            throw new RepositoryException('This agency payment is already marked paid.');
        }

        if ($payment->status !== Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[2]) {
            throw new RepositoryException('Agency payment must be approved before marking paid.');
        }

        return DB::transaction(function () use ($payment, $payDateYmd, $userId, $linkExpense) {
            $payment->refresh();
            $payment->pay_date = $payDateYmd;
            $payment->status = Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[3];
            $payment->save();

            if ($linkExpense) {
                $agency = $payment->agency()->firstOrFail();
                $monthLabel = $payment->calendar_month->format('Y-m');

                $description = sprintf(
                    'Agency payment — %s — %s — %s workers',
                    $agency->name,
                    $monthLabel,
                    $payment->worker_count
                );

                $expense = $this->expenses->createPayrollLinkedExpense(
                    $description,
                    (float) $payment->amount_paid,
                    $payDateYmd,
                    $userId
                );

                $payment->expense_id = $expense->id;
                $payment->save();
            }

            return $payment->fresh(['agency', 'placement', 'expense', 'creator', 'approver']);
        });
    }

    public function delete(AgencyMonthlyPayment $payment): void
    {
        if ($payment->status !== Controller::_AGENCY_MONTHLY_PAYMENT_STATUSES[0]) {
            throw new RepositoryException('Only draft agency payments can be deleted.');
        }

        $payment->delete();
    }
}
