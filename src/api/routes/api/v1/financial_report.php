<?php

use App\Http\Controllers\Api\V1\FinancialReportController;
use Illuminate\Support\Facades\Route;

Route::get('/income-summary', [FinancialReportController::class, 'incomeSummary'])->name('income_summary');
Route::get('/expenses-by-category', [FinancialReportController::class, 'expensesByCategory'])->name('expenses_by_category');
Route::get('/payroll-direct', [FinancialReportController::class, 'payrollDirect'])->name('payroll_direct');
Route::get('/payroll-agencies', [FinancialReportController::class, 'payrollAgencies'])->name('payroll_agencies');
Route::get('/profit-and-loss', [FinancialReportController::class, 'profitAndLoss'])->name('profit_and_loss');
Route::get('/export', [FinancialReportController::class, 'exportCsv'])->name('export');
