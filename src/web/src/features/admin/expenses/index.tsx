import { Main } from "@/components/layout/main";
import { fetchExpenses, deleteExpense } from "./lib/expenses";
import { columns } from "./components/columns";
import { DataTable } from "@/components/data-table/data-table";
import React, { useCallback, useEffect, useState } from "react";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useDebounce } from "use-debounce";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AddExpenseForm } from "./components/add-expense-form";
import type { Expense } from "@/types/types";
import { IconPlus } from "@tabler/icons-react";
import { EditExpenseForm } from "./components/edit-expense-form";
import { CategoryManagerSheet } from "./components/category-manager-sheet";
import { VendorManagerSheet } from "./components/vendor-manager-sheet";
import { fetchExpenseCategoriesActive } from "./lib/expenses";
import type { ExpenseCategory } from "@/types/types";
import { useAuthStore } from "@/stores/auth-store";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function canEditExpense(
  expense: Expense,
  role: string | undefined,
  userId: number | undefined
): boolean {
  if (role === "admin" || role === "accountant") return true;
  if (role === "secretary" && userId != null && expense.created_by === userId) {
    return true;
  }
  return false;
}

export function Expenses() {
  const user = useAuthStore((s) => s.user);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [data, setData] = useState<Expense[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteExpenseRow, setDeleteExpenseRow] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState<ExpenseCategory[]>([]);

  const refreshExpenses = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchExpenses(
      page.toString(),
      pagination.pageSize.toString(),
      debouncedSearch,
      {
        expense_category_id: categoryFilter || undefined,
        status: statusFilter || undefined,
      }
    );
    setData(res.data);
    setPageCount(res.meta.last_page);
    setIsLoading(false);
    setIsInitialLoading(false);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    categoryFilter,
    statusFilter,
  ]);

  useEffect(() => {
    refreshExpenses();
  }, [refreshExpenses]);

  useEffect(() => {
    let cancelled = false;
    fetchExpenseCategoriesActive()
      .then((cats) => {
        if (!cancelled) setCategoryOptions(cats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const onDelete = (expense: Expense) => {
    setDeleteExpenseRow(expense);
  };

  const confirmDeleteExpense = async () => {
    if (!deleteExpenseRow) return;
    setDeleting(true);
    try {
      await deleteExpense(deleteExpenseRow.id);
      toast.success("Expense deleted");
      setDeleteExpenseRow(null);
      await refreshExpenses();
    } catch (err) {
      const e = err as ApiError;
      toast.error(
        (e.data as { message?: string })?.message ?? "Could not delete expense"
      );
    } finally {
      setDeleting(false);
    }
  };

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: { pagination, rowSelection },
    manualPagination: true,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    meta: {
      setEditExpense,
      setIsEditOpen,
      onDelete,
      canEdit: (e: Expense) => canEditExpense(e, user?.role, user?.id),
      canDelete: (_e: Expense) => user?.role === "admin",
      isLoading,
    },
  });

  return (
    <Main>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expenses</h2>
          <p className="text-muted-foreground">
            Operational expenses by category and vendor.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.role === "admin" && <CategoryManagerSheet />}
          {(user?.role === "admin" || user?.role === "accountant") && (
            <VendorManagerSheet />
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus className="h-4 w-4" />
                Add expense
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-full sm:max-w-lg overflow-auto"
            >
              <SheetHeader>
                <SheetTitle className="text-center">New expense</SheetTitle>
                <SheetDescription className="text-center">
                  Record an expense with category and optional vendor.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 pb-10">
                <AddExpenseForm
                  onSuccess={() => {
                    setOpen(false);
                    refreshExpenses();
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>

        </div>
      </div>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-auto"
        >
          <SheetHeader>
            <SheetTitle className="text-center">Edit expense</SheetTitle>
            <SheetDescription className="text-center">
              Update amounts, status, or vendor.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 pb-10">
            {editExpense && canEditExpense(editExpense, user?.role, user?.id) && (
              <EditExpenseForm
                expense={editExpense}
                onSuccess={() => {
                  setIsEditOpen(false);
                  setEditExpense(null);
                  refreshExpenses();
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          value={categoryFilter || "__all__"}
          onValueChange={(v) => setCategoryFilter(v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter || "__all__"}
          onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partially_paid">Partially paid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
        {isInitialLoading ? (
          <DataTableSkeleton
            columnCount={6}
            filterCount={1}
            cellWidths={[
              "4rem",
              "12rem",
              "8rem",
              "6rem",
              "6rem",
              "10rem",
              "4rem",
            ]}
            shrinkZero
          />
        ) : (
          <DataTable
            table={table}
            onChange={setSearch}
            searchValue={search}
          />
        )}
      </div>

      <ConfirmDialog
        open={!!deleteExpenseRow}
        onOpenChange={(o) => !o && setDeleteExpenseRow(null)}
        title="Delete this expense?"
        desc="This will soft-delete the expense record."
        handleConfirm={confirmDeleteExpense}
        isLoading={deleting}
        destructive
        confirmText="Delete"
      />
    </Main>
  );
}
