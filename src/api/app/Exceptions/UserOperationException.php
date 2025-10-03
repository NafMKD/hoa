<?php

namespace App\Exceptions;

use Exception;

class UserOperationException extends Exception
{
    /**
     * Create a new exception instance.
     *
     * @param string $message
     * @param int $code
     */
    public function __construct(string $message = "User operation failed", int $code = 500)
    {
        parent::__construct($message, $code);
    }
}
