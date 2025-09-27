<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vote extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'poll_id',
        'option_id',
        'user_id',
    ];

    /**
     * Get the poll this vote belongs to.
     *
     * @return BelongsTo
     */
    public function poll(): BelongsTo
    {
        return $this->belongsTo(Poll::class);
    }

    /**
     * Get the option this vote is for.
     *
     * @return BelongsTo
     */
    public function option(): BelongsTo
    {
        return $this->belongsTo(PollOption::class, 'option_id');
    }

    /**
     * Get the user who cast this vote.
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
