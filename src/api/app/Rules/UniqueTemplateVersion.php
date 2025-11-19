<?php

namespace App\Rules;

use App\Models\DocumentTemplate;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueTemplateVersion implements ValidationRule, DataAwareRule
{
    protected array $data = [];

    /**
     * Set the data for DataAwareRule.
     */
    public function setData(array $data): self
    {
        $this->data = $data;
        return $this;
    }

    /**
     * Run the validation rule.
     *
     * @param  string  $attribute
     * @param  mixed   $value
     * @param  \Closure(string): void  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $query = DocumentTemplate::query()
            ->where('category', $this->data['category'] ?? null)
            ->where('sub_category', $this->data['sub_category'] ?? null)
            ->where('version', $value);

        // Include soft-deleted records if using SoftDeletes
        if (method_exists(DocumentTemplate::class, 'bootSoftDeletes')) {
            $query->withTrashed();
        }

        if ($query->exists()) {
            $fail($this->message());
        }
    }

    /**
     * Custom validation message.
     */
    public function message(): string
    {
        return 'This version already exists for the selected category and sub-category.';
    }
}
