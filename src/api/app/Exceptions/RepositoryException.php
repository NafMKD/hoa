<?php

namespace App\Exceptions;

use Exception;

class RepositoryException extends Exception
{
    /**
     * Create a new exception instance.
     *
     * @param string $message
     * @param int $code
     */
    public function __construct($message = "Repository Error", $code = 500)
    {
        parent::__construct($message, $code);
    }
}
