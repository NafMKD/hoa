import { Main } from "@/components/layout/main";
import { fetchVehicles } from "./lib/vehicles";
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
import { AddVehicleForm } from "./components/add-vehicle-form";
import type { Vehicle } from "@/types/types";
import { IconPlus } from "@tabler/icons-react";
import { EditVehicleForm } from "./components/edit-vehicle-form";

export function Vehicles() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [data, setData] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const refreshVehicles = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchVehicles(
      page.toString(),
      pagination.pageSize.toString(),
      debouncedSearch
    );
    setData(res.data);
    setPageCount(res.meta?.last_page ?? 0);
    setIsLoading(false);

    setIsInitialLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

  useEffect(() => {
    refreshVehicles();
  }, [refreshVehicles]);

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
    meta: { setEditVehicle, setIsEditOpen, isLoading },
  });

  return (
    <Main>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Vehicles</h2>
          <p className="text-muted-foreground">
            Manage vehicles, ownership and related documents here.
          </p>
        </div>

        {/* Right-side actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setOpen(true)} className="gap-2">
                <IconPlus className="h-4 w-4" />
                Add Vehicle
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-full sm:max-w-lg overflow-auto"
            >
              <SheetHeader>
                <SheetTitle className="text-center">Add New Vehicle</SheetTitle>
                <SheetDescription className="text-center">
                  Fill in vehicle information below.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 pb-10">
                <AddVehicleForm
                  onSuccess={() => {
                    setOpen(false);
                    refreshVehicles();
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
                <SheetTitle className="text-center">Edit Vehicle</SheetTitle>
                <SheetDescription className="text-center">
                  Update the vehicle information below.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 pb-10">
                {editVehicle && (
                  <EditVehicleForm
                    vehicle={editVehicle}
                    unitName={editVehicle.unit?.name as string}
                    onSuccess={() => {
                      setIsEditOpen(false);
                      setEditVehicle(null);
                      refreshVehicles();
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
            columnCount={8}
            filterCount={1}
            cellWidths={[
              "4rem",
              "8rem",
              "8rem",
              "6rem",
              "8rem",
              "8rem",
              "8rem",
              "4rem",
            ]}
            shrinkZero
          />
        ) : (
          <DataTable table={table} onChange={setSearch} searchValue={search} />
        )}
      </div>
    </Main>
  );
}

export default Vehicles;
