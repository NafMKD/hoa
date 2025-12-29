import { Main } from "@/components/layout/main";
import { fetchFees } from "./lib/fees";
import { columns } from "./components/columns"; // Ensure you create this based on FeeResource
import { DataTable } from "@/components/data-table/data-table";
import React, { useEffect, useState, useCallback } from "react";
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
import { AddFeeForm } from "./components/add-fee-form"; // Rename AddBuildingForm
import type { Fee } from "@/types/types";
import { IconPlus } from "@tabler/icons-react";
import { EditFeeForm } from "./components/edit-fee-form"; // Rename EditBuildingForm

export function Fees() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [data, setData] = useState<Fee[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);
  const [editFee, setEditFee] = useState<Fee | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const refreshFees = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchFees(
      page.toString(),
      pagination.pageSize.toString(),
      debouncedSearch
    );
    setData(res.data);
    setPageCount(res.meta.last_page);
    setIsLoading(false);

    setIsInitialLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  useEffect(() => {
    refreshFees();
  }, [refreshFees]);

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
    meta: { setEditFee, setIsEditOpen, isLoading },
  });

  return (
    <Main>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fees</h2>
          <p className="text-muted-foreground">
            Manage fees, and recurring charges here.
          </p>
        </div>

        {/* Right-side actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus className="h-4 w-4" />
                Add Fee
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-full sm:max-w-lg overflow-auto"
            >
              <SheetHeader>
                <SheetTitle className="text-center">
                  Add New Fee
                </SheetTitle>
                <SheetDescription className="text-center">
                  Fill in fee information below.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 pb-10">
                <AddFeeForm
                  onSuccess={() => {
                    setOpen(false);
                    refreshFees();
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
            <SheetContent
              side="right"
              className="w-full sm:max-w-lg overflow-auto"
            >
              <SheetHeader>
                <SheetTitle className="text-center">Edit Fee</SheetTitle>
                <SheetDescription className="text-center">
                  Update the fee information below.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 pb-10">
                {editFee && (
                  <EditFeeForm
                    fee={editFee}
                    onSuccess={() => {
                      setIsEditOpen(false);
                      setEditFee(null);
                      refreshFees();
                    }}
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

      </div>

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
        {isInitialLoading ? (
          <DataTableSkeleton
            columnCount={6}
            filterCount={1}
            cellWidths={["4rem", "12rem", "8rem", "6rem", "6rem", "10rem", "4rem"]}
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
    </Main>
  );
}