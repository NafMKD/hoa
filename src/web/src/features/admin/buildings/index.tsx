import { Main } from "@/components/layout/main";
import { fetchBuildings } from "./lib/buildings";
import { columns } from "./components/columns";
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
import { AddBuildingForm } from "./components/add-building-form";
import type { Building } from "@/types/types";
import { IconPlus } from "@tabler/icons-react";
import { EditBuildingForm } from "./components/edit-building-form";
import { ImportBuildingsDialog } from "./components/import-buildings-dialog";

export function Buildings() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [data, setData] = useState<Building[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);
  const [editBuilding, setEditBuilding] = useState<Building | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const refreshBuildings = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchBuildings(
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
    refreshBuildings();
  }, [refreshBuildings]);

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
    meta: { setEditBuilding, setIsEditOpen, isLoading },
  });

  return (
    <Main>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Buildings</h2>
          <p className="text-muted-foreground">
            Manage community buildings here.
          </p>
        </div>

        {/* Right-side actions */}
        <div className="flex flex-wrap items-center gap-2">
          <ImportBuildingsDialog
            onSuccess={refreshBuildings}
            templateUrl="/templates/buildings-import-template.xlsx"
          />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus className="h-4 w-4" />
                Add Building
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-full sm:max-w-lg overflow-auto"
            >
              <SheetHeader>
                <SheetTitle className="text-center">
                  Add New Building
                </SheetTitle>
                <SheetDescription className="text-center">
                  Fill in building information below.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 pb-10">
                <AddBuildingForm
                  onSuccess={() => {
                    setOpen(false);
                    refreshBuildings();
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Edit sheet */}
        <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-lg overflow-auto"
          >
            <SheetHeader>
              <SheetTitle className="text-center">Edit Building</SheetTitle>
              <SheetDescription className="text-center">
                Update the building information below.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 pb-10">
              {editBuilding && (
                <EditBuildingForm
                  building={editBuilding}
                  onSuccess={() => {
                    setIsEditOpen(false);
                    setEditBuilding(null);
                    refreshBuildings();
                  }}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
        {isInitialLoading ? (
          <DataTableSkeleton
            columnCount={6}
            filterCount={1}
            cellWidths={["4rem", "4rem", "12rem", "8rem", "8rem", "10rem", "4rem"]}
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
