<?php

namespace App\Repositories\Api\V1;

use App\Exceptions\RepositoryException;
use App\Jobs\Api\V1\ReconcileBankBatchJob;
use App\Models\BankStatementBatch;
use App\Models\BankTransaction;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class BankStatementBatchRepository
{
    /**
     * Create batch from uploaded CSV file.
     *
     * @param UploadedFile $file
     * @param int $adminId
     * @return BankStatementBatch
     * @throws RepositoryException
     */
    public function createFromCsv(UploadedFile $file, int $adminId): BankStatementBatch
    {
        DB::beginTransaction();
        try {
            $path = $file->store('bank-statements', 'public');
            $rows = $this->parseCsv($file);

            $batch = BankStatementBatch::create([
                'admin_id'    => $adminId,
                'file_path'   => $path,
                'file_name'   => $file->getClientOriginalName(),
                'row_count'   => count($rows),
                'status'      => 'pending',
            ]);

            foreach ($rows as $row) {
                BankTransaction::create([
                    'batch_id'         => $batch->id,
                    'amount'           => $row['amount'],
                    'reference'        => $row['reference'] ?? null,
                    'transaction_date' => $row['date'],
                    'description'      => $row['description'] ?? null,
                    'raw_data'         => $row,
                    'status'           => 'unmatched',
                ]);
            }

            $batch->update(['status' => 'processing']);
            DB::commit();

            ReconcileBankBatchJob::dispatch($batch->id);

            return $batch->fresh();
        } catch (\Throwable $e) {
            DB::rollBack();
            if (isset($path) && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
            Log::error('Bank statement import failed: ' . $e->getMessage());
            throw new RepositoryException('Failed to import bank statement: ' . $e->getMessage());
        }
    }

    /**
     * Parse CSV and return rows with mapped columns.
     *
     * @param UploadedFile $file
     * @return array<int, array{date: string, amount: float, reference: string|null, description: string|null}>
     */
    protected function parseCsv(UploadedFile $file): array
    {
        $columns = config('reconciliation.csv_columns', [
            'date' => 'date',
            'amount' => 'amount',
            'reference' => 'reference',
            'description' => 'description',
        ]);

        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            throw new RepositoryException('Could not read CSV file.');
        }

        $headers = array_map('trim', (array) fgetcsv($handle));
        $rows = [];
        $rowNum = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $rowNum++;
            $row = array_combine($headers, array_pad($data, count($headers), null));
            if (!$row) {
                continue;
            }

            $dateCol = $columns['date'];
            $amountCol = $columns['amount'];
            $date = $this->normalizeDate($row[$dateCol] ?? '');
            $amount = $this->normalizeAmount($row[$amountCol] ?? 0);

            if (!$date || $amount === null) {
                continue;
            }

            $rows[] = [
                'date'        => $date,
                'amount'      => $amount,
                'reference'   => trim($row[$columns['reference']] ?? '') ?: null,
                'description' => trim($row[$columns['description']] ?? '') ?: null,
            ];
        }

        fclose($handle);
        return $rows;
    }

    protected function normalizeDate(string $value): ?string
    {
        $value = trim($value);
        if (empty($value)) {
            return null;
        }
        $timestamp = strtotime($value);
        return $timestamp ? date('Y-m-d', $timestamp) : null;
    }

    protected function normalizeAmount(mixed $value): ?float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }
        $cleaned = preg_replace('/[^\d.-]/', '', (string) $value);
        return $cleaned !== '' ? (float) $cleaned : null;
    }
}
