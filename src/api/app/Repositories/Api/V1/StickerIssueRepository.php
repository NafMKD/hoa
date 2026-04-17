<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Fee;
use App\Models\Invoice;
use App\Models\StickerIssue;
use App\Models\Vehicle;
use App\Support\ParkingStickerScramble;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class StickerIssueRepository
{
    /** 1×1 transparent PNG (placeholder file for qr_code_file_id FK; scannable QR is built client-side from lookup_token). */
    private const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    public function __construct(
        protected DocumentRepository $documents,
        protected InvoiceRepository $invoices,
    ) {
    }

    /**
     * @return Collection<int, StickerIssue>|LengthAwarePaginator<int, StickerIssue>
     */
    public function forVehicle(Vehicle $vehicle, ?int $perPage = null): Collection|LengthAwarePaginator
    {
        $query = StickerIssue::query()
            ->where('vehicle_id', $vehicle->id)
            ->with(['issuer', 'replacementInvoice', 'lostPenaltyInvoice'])
            ->orderByDesc('issued_at');

        return $perPage ? $query->paginate($perPage) : $query->get();
    }

    /**
     * Lost (penalty invoice paid in full) or returned stickers not yet superseded.
     *
     * @return Collection<int, StickerIssue>
     */
    public function pendingReplacementStickers(Vehicle $vehicle): Collection
    {
        return StickerIssue::query()
            ->where('vehicle_id', $vehicle->id)
            ->whereDoesntHave('replacedBy')
            ->where(function ($q) {
                $q->where('status', 'returned')
                    ->orWhere(function ($q2) {
                        $q2->where('status', 'lost')
                            ->whereNotNull('lost_penalty_invoice_id')
                            ->whereHas('lostPenaltyInvoice', function ($inv) {
                                $inv->where('status', '!=', Controller::_INVOICE_STATUSES[4])
                                    ->where(function ($q3) {
                                        $q3->where('status', Controller::_INVOICE_STATUSES[2])
                                            ->orWhereRaw('(total_amount + COALESCE(penalty_amount,0) - COALESCE(amount_paid,0)) <= 0');
                                    });
                            });
                    });
            })
            ->orderByDesc('issued_at')
            ->get();
    }

    /**
     * Issue a new sticker. At most one active sticker per vehicle; close out the current one (lost / returned / revoke) before replacing.
     *
     * @param  array<string, mixed>  $data
     */
    public function issue(Vehicle $vehicle, array $data = []): StickerIssue
    {
        return DB::transaction(function () use ($vehicle, $data) {
            $vehicle->loadMissing('unit');

            $hasActive = StickerIssue::query()
                ->where('vehicle_id', $vehicle->id)
                ->where('status', 'active')
                ->exists();

            if ($hasActive) {
                throw new RepositoryException('An active sticker exists. Mark it as lost, returned, or revoked before issuing a replacement.');
            }

            $supersedesId = isset($data['supersedes_sticker_issue_id'])
                ? (int) $data['supersedes_sticker_issue_id']
                : null;

            $pending = $this->pendingReplacementStickers($vehicle);

            // Unambiguous when only one lost/returned row is waiting — avoids races if the client
            // issues before its pending-replacements request finishes.
            if ($supersedesId === null && $pending->count() === 1) {
                $supersedesId = (int) $pending->first()->id;
            }

            $supersedes = null;
            if ($supersedesId !== null) {
                $supersedes = StickerIssue::query()
                    ->where('vehicle_id', $vehicle->id)
                    ->where('id', $supersedesId)
                    ->first();
                if (! $supersedes) {
                    throw new RepositoryException('Invalid sticker to replace.');
                }
                if (! in_array($supersedes->status, ['lost', 'returned'], true)) {
                    throw new RepositoryException('Only lost or returned stickers can be superseded.');
                }
                if ($supersedes->replacedBy()->exists()) {
                    throw new RepositoryException('That sticker was already replaced.');
                }
            }

            if ($pending->isNotEmpty() && $supersedesId === null) {
                throw new RepositoryException('Select which lost or returned sticker is being replaced.');
            }

            if ($supersedesId !== null && $pending->isNotEmpty()) {
                $ids = $pending->pluck('id')->all();
                if (! in_array((int) $supersedesId, $ids, true)) {
                    throw new RepositoryException('The selected sticker is not pending replacement.');
                }
            }

            if ($supersedes && $supersedes->status === 'lost') {
                if (! $supersedes->lost_penalty_invoice_id) {
                    throw new RepositoryException('Lost sticker is missing a penalty invoice.');
                }
                $inv = $supersedes->lostPenaltyInvoice ?? Invoice::find($supersedes->lost_penalty_invoice_id);
                if (! $inv || ! $this->invoiceAllowsLostStickerReissue($inv)) {
                    throw new RepositoryException('Pay the lost sticker penalty invoice in full before issuing a replacement.');
                }
            }

            if ($supersedes && $supersedes->status === 'returned') {
                // no fee / invoice required
            }

            $png = base64_decode(self::TINY_PNG_BASE64, true);
            if ($png === false) {
                throw new RepositoryException('Invalid placeholder image.');
            }

            $path = 'stickers/qr/'.Str::uuid().'.png';
            $doc = $this->documents->createFromBinary(
                $png,
                $path,
                'sticker-qr-placeholder.png',
                Controller::_DOCUMENT_TYPES[6]
            );

            $stickerCode = $this->uniqueStickerCode();
            $lookupToken = bin2hex(random_bytes(16));

            $expiresAt = null;
            if (! empty($data['expires_at'])) {
                $expiresAt = Carbon::parse($data['expires_at']);
            }

            $issue = StickerIssue::create([
                'vehicle_id' => $vehicle->id,
                'replaces_sticker_issue_id' => $supersedes?->id,
                'sticker_code' => $stickerCode,
                'lookup_token' => $lookupToken,
                'issued_by' => Auth::id(),
                'issued_at' => now(),
                'expires_at' => $expiresAt,
                'status' => 'active',
                'qr_code_file_id' => $doc->id,
                'replacement_invoice_id' => null,
            ]);

            return $issue->fresh(['vehicle.unit', 'issuer', 'qrCode', 'replacementInvoice', 'lostPenaltyInvoice']);
        });
    }

    private function invoiceAllowsLostStickerReissue(Invoice $invoice): bool
    {
        if ($invoice->status === Controller::_INVOICE_STATUSES[4]) {
            return false;
        }

        if ($invoice->status === Controller::_INVOICE_STATUSES[2]) {
            return true;
        }

        return $invoice->final_amount_due <= 0.00001;
    }

    public function revoke(StickerIssue $issue): StickerIssue
    {
        return DB::transaction(function () use ($issue) {
            if ($issue->status !== 'active') {
                throw new RepositoryException('Only active stickers can be revoked.');
            }
            $issue->status = 'revoked';
            $issue->save();

            return $issue->fresh(['vehicle.unit', 'issuer', 'qrCode', 'replacementInvoice', 'lostPenaltyInvoice']);
        });
    }

    /**
     * Mark active sticker lost: creates penalty invoice for the unit and links it to this sticker row.
     *
     * @param  int|null  $feeId  Optional override; otherwise uses vehicle.lost_sticker_fee_id
     */
    public function markLost(StickerIssue $issue, ?int $feeId = null): StickerIssue
    {
        return DB::transaction(function () use ($issue, $feeId) {
            if ($issue->status !== 'active') {
                throw new RepositoryException('Only active stickers can be marked as lost.');
            }

            $issue->loadMissing('vehicle.unit', 'vehicle.lostStickerFee');
            $vehicle = $issue->vehicle;
            if (! $vehicle) {
                throw new RepositoryException('Vehicle not found for this sticker.');
            }

            $resolvedFeeId = $feeId ?? $vehicle->lost_sticker_fee_id;
            if (! $resolvedFeeId) {
                throw new RepositoryException('Set a default lost sticker fee on the vehicle or pass fee_id when marking lost.');
            }

            $fee = Fee::find($resolvedFeeId);
            if (! $fee || $fee->category !== Controller::_FEE_CATEGORIES[3] || $fee->status !== Controller::_FEE_STATUSES[0]) {
                throw new RepositoryException('The lost sticker fee must be an active penalty fee.');
            }

            $invoice = $this->invoices->create([
                'unit_id' => $vehicle->unit_id,
                'source_id' => $fee->id,
                'total_amount' => $fee->amount,
                'issue_date' => now()->toDateString(),
                'due_date' => now()->addDays(Controller::_DEFAULT_DUE_DAYS)->toDateString(),
                'metadata' => [
                    'generated_by' => 'sticker_mark_lost',
                    'legacy' => false,
                    'sticker_mark_lost' => [
                        'sticker_issue_id' => $issue->id,
                    ],
                ],
            ]);

            $issue->status = 'lost';
            $issue->lost_penalty_invoice_id = $invoice->id;
            $issue->save();

            return $issue->fresh(['vehicle.unit', 'issuer', 'qrCode', 'lostPenaltyInvoice', 'replacementInvoice']);
        });
    }

    public function markReturned(StickerIssue $issue): StickerIssue
    {
        return DB::transaction(function () use ($issue) {
            if ($issue->status !== 'active') {
                throw new RepositoryException('Only active stickers can be marked as returned.');
            }
            $issue->status = 'returned';
            $issue->save();

            return $issue->fresh(['vehicle.unit', 'issuer', 'qrCode', 'lostPenaltyInvoice', 'replacementInvoice']);
        });
    }

    public function findByLookupToken(string $token): ?StickerIssue
    {
        return StickerIssue::query()
            ->where('lookup_token', $token)
            ->with(['vehicle.unit.building', 'issuer'])
            ->first();
    }

    public function stickerLine(StickerIssue $issue): string
    {
        $issue->loadMissing('vehicle.unit');

        $plate = $issue->vehicle->license_plate ?? '';
        $unitName = $issue->vehicle->unit->name ?? '';

        return ParkingStickerScramble::line($plate, $unitName);
    }

    private function uniqueStickerCode(): string
    {
        do {
            $code = 'STK-'.date('Y').'-'.strtoupper(Str::random(6));
        } while (StickerIssue::where('sticker_code', $code)->exists());

        return $code;
    }
}
