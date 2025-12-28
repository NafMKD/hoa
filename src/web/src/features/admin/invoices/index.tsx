import { Main } from "@/components/layout/main";
import { fetchInvoices } from "./lib/invoices";
import { columns } from "./components/columns";
import { DataTable } from "@/components/data-table/data-table";
import { useEffect, useState, useCallback } from "react";
import { useReactTable, getCoreRowModel, getPaginationRowModel, type PaginationState } from "@tanstack/react-table";
import { useDebounce } from "use-debounce";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import type { Invoice } from "@/types/types";

export function Invoices() {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [pageCount, setPageCount] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const res = await fetchInvoices((pagination.pageIndex + 1).toString(), pagination.pageSize.toString(), debouncedSearch);
    setData(res.data);
    setPageCount(res.meta.last_page);
    setIsLoading(false);
    setIsInitialLoading(false);
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
    <Main>
      <div className="mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Invoices</h2>
        <p className="text-muted-foreground">Track payments and outstanding balances.</p>
      </div>
      <div className="-mx-4 flex-1 overflow-auto px-4 py-1">
        {isInitialLoading ? (
          <DataTableSkeleton columnCount={5} shrinkZero />
        ) : (
          <DataTable table={table} onChange={setSearch} searchValue={search} />
        )}
      </div>
    </Main>
  );
}