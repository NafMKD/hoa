<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

abstract class Controller
{
    use AuthorizesRequests;
    const _SUCCESS = 'success';
    const _ERROR = 'error';
    const _UNKNOWN_ERROR = 'An unknown error occurred. Please try again.';
    /**
     * @var list<string>
     */
    const _ROLES = ['admin','accountant','secretary','homeowner','tenant'];
    /**
     * @var list<string>
     */
    const _DOCUMENT_TYPES = ['id_files', 'ownership_files', 'payslip', 'payments', 'tenantLeases', 'vehicles', 'stickers', 'lease_document'];
    const _DEFAULT_PAGINATION = 10;
    const _UNAUTHORIZED = 'Unauthorized action.';
    const _MAX_FILE_SIZE = 5120; // in KB
    const _DEFAULT_ADDRESS = 'Figga, Addis Ababa';
    const _UNIT_STATUS = ['rented','owner_occupied','vacant'];
    const _UNIT_TYPES = ['1','2','3','4'];
    const _DOCUMENT_TEMPLATE_CATEGORIES = ['lease_agreement', 'letter', 'reminder', 'other'];

}
