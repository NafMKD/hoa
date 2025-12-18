<?php

namespace App\Models;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Invoice extends Model
{
    use SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'invoice_number',
        'user_id',
        'unit_id',
        'issue_date',
        'due_date',
        'total_amount',
        'amount_paid',
        'status',
        'source_type',
        'source_id',
        'penalty_amount',
        'metadata',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string,string>
     */
    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'due_date' => 'date',
            'total_amount' => 'float',
            'amount_paid' => 'float',
            'penalty_amount' => 'float',
            'metadata' => 'array',
        ];
    }

    /**
     * Get the final amount due on the invoice, including penalties.
     * 
     * @return float
     */
    public function getFinalAmountDueAttribute(): float
    {
        return $this->total_amount + $this->penalty_amount - $this->amount_paid;
    }

    /**
     * Get the user (payer) of the invoice.
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the unit related to this invoice.
     *
     * @return BelongsTo
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * Get payments applied to this invoice.
     *
     * @return HasMany
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Get the source model (fee, payment, etc.) that generated this invoice.
     *
     * @return MorphTo
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get penalty related to this invoice if the source type is fee.
     * 
     * @return HasMany
     */
    public function penalties(): HasMany
    {
        return $this->hasMany(InvoicePenalties::class);
    }


    /**
     * Check if the invoice is penalizable
     * 
     * @return bool
     */
    public function getIsPenalizableAttribute(): bool
    {
        if ($this->source_type === "App\\Models\\Fee" && $this->source) {
            return $this->source->is_penalizable;
        }
        return false;
    }

    /**
     * Determine if the invoice is overdue.
     * 
     * @return bool
     */
    public function getIsOverdueAttribute(): bool
    {
        return $this->due_date < now()->toDateString();
    }

    /**
     * Get the outstanding amount on the invoice.
     * 
     * @return float
     */
    public function getOutStandingAmountAttribute(): float
    {
        return max(0, $this->total_amount + $this->penalty_amount - $this->amount_paid);
    }

    /**
     * Apply penalty to the invoice.
     * 
     * @return void
     */
    public function applyPenalty(): void
    {
        if (!$this->is_penalizable || !$this->due_date) {
            return;
        }

        $dueDate = Carbon::parse($this->due_date);
        $now = Carbon::now()->startOfDay();

        // If today is on or before due date, no penalty yet.
        if ($now->lte($dueDate)) {
            return;
        }

        DB::transaction(function () use ($dueDate, $now) {
            $this->refresh();

            // Fetch existing reasons to prevent duplicates
            $existingReasons = $this->penalties()->pluck('reason')->toArray();

            $penaltyAmount = Controller::_FEE_FIXED_PENALTY;
            $periodCounter = 1;

            // Start checking from the day AFTER due date
            // Example: Due Jan 10 -> Start counting Jan 11
            $currentStart = $dueDate->copy()->addDay();

            // Loop as long as the start of the penalty period has been reached
            while ($currentStart->lte($now)) {

                // LOGIC CHANGE HERE:
                // First period is 20 days, all others are 30 days
                $daysInThisPeriod = ($periodCounter === 1) ? 20 : 30;

                // Calculate the end of this specific period
                // We subtract 1 day because the start day counts as day 1
                // e.g., Jan 11 + 20 days would be Jan 31, but we want Jan 30 (inclusive)
                $currentEnd = $currentStart->copy()->addDays($daysInThisPeriod - 1);

                // Generate Unique Reason Key
                $reasonKey = "Overdue Period #{$periodCounter}";
                $fullReason = "{$reasonKey}: {$currentStart->toDateString()} to {$currentEnd->toDateString()}";

                // Check if already applied
                $alreadyApplied = false;
                foreach ($existingReasons as $existing) {
                    if (str_starts_with($existing, $reasonKey)) {
                        $alreadyApplied = true;
                        break;
                    }
                }

                // Insert if valid and not duplicate
                if (!$alreadyApplied) {
                    $this->penalties()->create([
                        'amount'       => $penaltyAmount,
                        'applied_date' => $now->toDateString(),
                        'reason'       => $fullReason,
                    ]);
                }

                // PREPARE FOR NEXT LOOP:
                // The next period starts the day after this one ends
                $currentStart = $currentEnd->copy()->addDay();
                $periodCounter++;
            }

            // Update total sum on invoice
            $this->update([
                'status' => Controller::_INVOICE_STATUSES[3],
                'penalty_amount' => $this->penalties()->sum('amount'),
            ]);
            $this->save();
        });
    }
}
