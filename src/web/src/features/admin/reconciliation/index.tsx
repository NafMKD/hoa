import { Main } from "@/components/layout/main";
import { fetchBatches, fetchEscalations } from "./lib/reconciliation";
import { batchColumns } from "./components/batch-columns";
import { escalationColumns } from "./components/escalation-columns";
import { UploadModal } from "./components/upload-modal";
import { ResolveModal } from "./components/resolve-modal";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { useEffect, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  type PaginationState,
  type ColumnDef,
} from "@tanstack/react-table";
import type { BankStatementBatch, ReconciliationEscalation } from "@/types/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function Reconciliation() {
  const [tab, setTab] = useState("batches");

  // Batches state
  const [batchPagination, setBatchPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [batchPageCount, setBatchPageCount] = useState(0);
  const [batchInitLoading, setBatchInitLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(true);
  const [batches, setBatches] = useState<BankStatementBatch[]>([]);
  const [batchSearch, setBatchSearch] = useState("");

  // Escalations state
  const [escPagination, setEscPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [escPageCount, setEscPageCount] = useState(0);
  const [escInitLoading, setEscInitLoading] = useState(true);
  const [escLoading, setEscLoading] = useState(true);
  const [escalations, setEscalations] = useState<ReconciliationEscalation[]>([]);
  const [escSearch, setEscSearch] = useState("");

  const refreshBatches = useCallback(async () => {
    setBatchLoading(true);
    try {
      const res = await fetchBatches((batchPagination.pageIndex + 1).toString(), batchPagination.pageSize.toString());
      setBatches(res.data);
      setBatchPageCount(res.meta.last_page);
    } catch (error) {
      console.error("Failed to fetch batches", error);
    } finally {
      setBatchLoading(false);
      setBatchInitLoading(false);
    }
  }, [batchPagination.pageIndex, batchPagination.pageSize]);

  const refreshEscalations = useCallback(async () => {
    setEscLoading(true);
    try {
      const res = await fetchEscalations((escPagination.pageIndex + 1).toString(), escPagination.pageSize.toString());
      setEscalations(res.data);
      setEscPageCount(res.meta.last_page);
    } catch (error) {
      console.error("Failed to fetch escalations", error);
    } finally {
      setEscLoading(false);
      setEscInitLoading(false);
    }
  }, [escPagination.pageIndex, escPagination.pageSize]);

  useEffect(() => { refreshBatches(); }, [refreshBatches]);
  useEffect(() => { if (tab === "escalations") refreshEscalations(); }, [tab, refreshEscalations]);

  const batchTable = useReactTable({
    data: batches,
    columns: batchColumns,
    pageCount: batchPageCount,
    state: { pagination: batchPagination },
    manualPagination: true,
    onPaginationChange: setBatchPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: { isLoading: batchLoading },
  });

  const escColumnsWithActions: ColumnDef<ReconciliationEscalation>[] = [
    ...escalationColumns,
    {
      id: "actions",
      cell: ({ row }) =>
        row.original.status === "pending" ? (
          <ResolveModal escalation={row.original} onResolved={refreshEscalations} />
        ) : (
          <span className="text-xs text-muted-foreground">Resolved</span>
        ),
    },
  ];

  const escTable = useReactTable({
    data: escalations,
    columns: escColumnsWithActions,
    pageCount: escPageCount,
    state: { pagination: escPagination },
    manualPagination: true,
    onPaginationChange: setEscPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: { isLoading: escLoading },
  });

  return (
    <Main>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Reconciliation</h2>
          <p className="text-muted-foreground">
            Upload bank statements, review matches, and resolve escalations.
          </p>
        </div>
        <UploadModal onSuccess={refreshBatches} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1">
        <TabsList>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="escalations">Escalations</TabsTrigger>
        </TabsList>

        <TabsContent value="batches" className="-mx-4 overflow-auto px-4 py-1">
          {batchInitLoading ? (
            <DataTableSkeleton columnCount={7} shrinkZero />
          ) : (
            <DataTable table={batchTable} onChange={setBatchSearch} searchValue={batchSearch} />
          )}
        </TabsContent>

        <TabsContent value="escalations" className="-mx-4 overflow-auto px-4 py-1">
          {escInitLoading ? (
            <DataTableSkeleton columnCount={7} shrinkZero />
          ) : (
            <DataTable table={escTable} onChange={setEscSearch} searchValue={escSearch} />
          )}
        </TabsContent>
      </Tabs>
    </Main>
  );
}
