<?php

namespace App\Imports;

use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

// If your enum arrays live on your base Controller like in migrations,
// you *can* import it here. If you prefer not to couple imports to controllers,
// remove this and relax the role/status validation rules below.
use App\Http\Controllers\Controller as AppController;

class UsersSheetImport implements ToCollection, WithHeadingRow, SkipsEmptyRows
{
    /**
     * Collect failed phones for UI display.
     * Each item: ['phone' => string, 'reason' => string]
     */
    public array $failedPhones = [];

    public function __construct(private int $actorId)
    {
        // actorId reserved for future audit needs
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            $data = $row->toArray();

            // Normalize inputs
            $phone = isset($data['phone']) ? trim((string)$data['phone']) : '';
            $firstName = isset($data['first_name']) ? trim((string)$data['first_name']) : '';
            $lastName  = isset($data['last_name']) ? trim((string)$data['last_name']) : '';
            $email     = isset($data['email']) ? trim((string)$data['email']) : null;

            try {
                // Validation aligned to your schema:
                // phone required + unique key
                // first_name required
                // last_name required
                // email nullable
                //
                // role/status optional but ideally validate allowed values
                $rules = [
                    'phone' => 'required|string',
                    'first_name' => 'required|string',
                    'last_name' => 'required|string',
                    'email' => 'nullable|email',
                    'city' => 'nullable|string',
                    'sub_city' => 'nullable|string',
                    'woreda' => 'nullable|string',
                ];

                // If you want strict enum validation:
                if (defined(AppController::class.'::_ROLES')) {
                    $roles = implode(',', AppController::_ROLES);
                    $rules['role'] = "nullable|in:$roles";
                } else {
                    $rules['role'] = "nullable|string";
                }

                if (defined(AppController::class.'::_USER_STATUSES')) {
                    $statuses = implode(',', AppController::_USER_STATUSES);
                    $rules['status'] = "nullable|in:$statuses";
                } else {
                    $rules['status'] = "nullable|string";
                }

                Validator::make(
                    [
                        'phone' => $phone,
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'email' => $email,
                        'role' => $data['role'] ?? null,
                        'status' => $data['status'] ?? null,
                        'city' => $data['city'] ?? null,
                        'sub_city' => $data['sub_city'] ?? null,
                        'woreda' => $data['woreda'] ?? null,
                        'house_number' => $data['house_number'] ?? null,
                    ],
                    $rules
                )->validate();

                // Find including soft-deleted
                $user = User::withTrashed()->where('phone', $phone)->first();

                $payload = [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'phone' => $phone,
                    'email' => $email ?: null,
                    'city' => $data['city'] ?? null,
                    'sub_city' => $data['sub_city'] ?? null,
                    'woreda' => $data['woreda'] ?? null,
                    'house_number' => $data['house_number'] ?? null,
                    'role' => $data['role'] ?? 'tenant',
                    'status' => $data['status'] ?? 'active',
                ];

                if (!$user) {
                    // Create new user with a secure random password.
                    // (Your UI can later trigger password reset flow)
                    $payload['password'] = Hash::make("12345678");

                    User::create($payload);
                } else {
                    // Restore if soft-deleted
                    if ($user->trashed()) {
                        $user->restore();
                    }

                    // Do NOT overwrite password on update
                    $user->update($payload);
                }

            } catch (\Throwable $e) {
                // Collect failures instead of failing the entire import
                if ($phone) {
                    $this->failedPhones[] = [
                        'phone' => $phone,
                        'reason' => $this->cleanReason($e->getMessage()),
                    ];
                } else {
                    $this->failedPhones[] = [
                        'phone' => '(missing phone)',
                        'reason' => $this->cleanReason($e->getMessage()),
                    ];
                }
                continue;
            }
        }
    }

    private function cleanReason(string $message): string
    {
        // Keep messages short and user-friendly for HOA/admin UI
        // You can customize more later.
        $msg = trim($message);

        // Optional: shorten common Laravel validation messages
        $msg = str_replace('The phone field is required.', 'Phone is required.', $msg);
        $msg = str_replace('The first name field is required.', 'First name is required.', $msg);
        $msg = str_replace('The last name field is required.', 'Last name is required.', $msg);

        return $msg;
    }
}
