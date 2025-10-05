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
    const _ROLES = ['admin','accountant','secretary','homeowner','tenant', 'representative'];
    /**
     * @var list<string>
     */
    const _DOCUMENT_TYPES = ['id_files', 'ownership_files', 'payslip', 'payments', 'lease_document', 'vehicles', 'stickers', 'representative_document'];
    const _DEFAULT_PAGINATION = 10;
    const _UNAUTHORIZED = 'Unauthorized action.';
    const _MAX_FILE_SIZE = 5120; // in KB
    const _DEFAULT_ADDRESS = 'Figga, Addis Ababa';
    const _UNIT_STATUSES = ['rented','owner_occupied','vacant'];
    const _UNIT_TYPES = ['1','2','3','4'];
    const _DOCUMENT_TEMPLATE_CATEGORIES = ['lease_agreement', 'letter', 'reminder', 'other'];
    const _LEASE_STATUS = ['active','terminated','expired','draft'];
    const _LEASE_AGREEMENT_TYPES = ['owner','representative'];
    const _FEE_CATEGORIES = ['administrational','special_assessment', 'other'];
    const _DEFAULT_DUE_DAYS = 10;
    const _INVOICE_STATUSES = ['issued','partial','paid','overdue','cancelled'];
    const _FEE_FIXED_PENALTY = 100;
}
