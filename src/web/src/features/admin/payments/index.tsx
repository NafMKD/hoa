import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { fetchPayments } from "./lib/payments";
import { columns } from "./components/columns";
import { AddPaymentModal } from "./components/add-payment-modal";
import { DataTable } from "@/components/data-table/data-table";
import { useEffect, useState, useCallback } from "react";
import { useReactTable, getCoreRowModel, getPaginationRowModel, type PaginationState } from "@tanstack/react-table";
import { useDebounce } from "use-debounce";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import type { Payment } from "@/types/types";

export function Payments() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchPayments((pagination.pageIndex + 1).toString(), pagination.pageSize.toString(), debouncedSearch);
      setData(res.data);
      setPageCount(res.meta.last_page);
    } catch (error) {
      console.error("Failed to fetch payments", error);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  useEffect(() => { refreshData(); }, [refreshData]);

  const table = useReactTable({
    data, columns, pageCount, state: { pagination }, 
    manualPagination: true, 
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(), 
    getPaginationRowModel: getPaginationRowModel(),
    meta: { isLoading }
  });

  return (
    <>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <Search /><ThemeSwitch /><ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Payments</h2>
            <p className="text-muted-foreground">Manage received payments and transaction history.</p>
          </div>
          <AddPaymentModal onSuccess={refreshData} />
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
          {isInitialLoading ? (
            <DataTableSkeleton columnCount={6} shrinkZero />
          ) : (
            <DataTable table={table} onChange={setSearch} searchValue={search} />
          )}
        </div>
      </Main>
    </>
  );
}