<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class PaymentRepository
{
    /**
     * Retrieve all payments with pagination.
     *
     * @param int $perPage
     * @return LengthAwarePaginator
     * @throws RepositoryException
     */
    public function all(?int $perPage = null): LengthAwarePaginator
    {
        try {
            return Payment::paginate($perPage);
        } catch (\Exception $e) {
            throw new RepositoryException('Failed to retrieve payments: ' . $e->getMessage());
        }
    }

    /**
     * Create a new payment.
     *
     * @param array<string, mixed> $data
     * @return Payment
     * @throws RepositoryException
     */
    public function create(array $data): Payment
    {
        DB::beginTransaction();
        try {
            if (isset($data['payment_screen_shoot'])) { 
                $path = $this->uploadIdFile($data['payment_screen_shoot']);
                $document = Document::create([
                    'file_path' => $path,
                    'file_name' => $data['payment_screen_shoot']->getClientOriginalName(),
                    'mime_type' => $data['payment_screen_shoot']->getClientMimeType(),
                    'file_size' => $data['payment_screen_shoot']->getSize(),
                    'category' => Controller::_DOCUMENT_TYPES[3] // 'payments'
                ]);

                $data['payment_screen_shoot_id'] = $document->id;
            }
            $payment = Payment::create($data);
            DB::commit();
            return $payment;
        } catch (\Exception $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to create payment: ' . $e->getMessage());
        }
    }

    /**
     * Update an existing payment.
     *
     * @param Payment $payment
     * @param array<string, mixed> $data
     * @return Payment
     * @throws RepositoryException
     */
    public function update(Payment $payment, array $data): Payment
    {
        DB::beginTransaction();
        try {
            $payment->update($data);
            DB::commit();
            return $payment;
        } catch (\Exception $e) {
            DB::rollBack();
            throw new RepositoryException('Failed to update payment: ' . $e->getMessage());
        }
    }

    /**
     * Delete a payment (soft delete).
     *
     * @param Payment $payment
     * @return bool
     * @throws RepositoryException
     */
    public function delete(Payment $payment): bool
    {
        try {
            return DB::transaction(function () use ($payment) {
            
                // TODO: Add any pre-deletion checks here
                return $payment->delete();
            });
        } catch (\Exception $e) {
            throw new RepositoryException('Failed to delete payment: ' . $e->getMessage());
        }
    }

    /**
     * Handle uploading ID file.
     *
     * @param UploadedFile|string $file
     * @return string
     */
    private function uploadIdFile($file): string
    {
        return $file->store(Controller::_DOCUMENT_TYPES[3], 'public');
    }
}
