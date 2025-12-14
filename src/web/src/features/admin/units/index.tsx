import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { fetchUnits } from "./lib/units";
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
import { AddUnitForm } from "./components/form/add-unit-form";
import type { Unit } from "@/types/types";
import { IconPlus } from "@tabler/icons-react";
import { EditUnitForm } from "./components/form/edit-unit-form";
import { Spinner } from "@/components/ui/spinner";
import { OwnershipForm } from "./components/form/ownership-form";
import { ImportUnitsDialog } from "./components/import-units-dialog";

export function Units() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [data, setData] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [addOwnership, setAddOwnership] = useState<Unit | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isOwnershipOpen, setIsOwnershipOpen] = useState(false);

  const refreshUnits = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;
    const res = await fetchUnits(
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
    refreshUnits();
  }, [refreshUnits]);

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
    meta: { setEditUnit, setIsEditOpen, setAddOwnership, setIsOwnershipOpen, isLoading },
  });

  return (
    <>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <Search />
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Units</h2>
            <p className="text-muted-foreground">
              Manage residential and commercial units here.
            </p>
          </div>

          {/* Right-side actions */}
          <div className="flex flex-wrap items-center gap-2">
            <ImportUnitsDialog
              onSuccess={refreshUnits}
              templateUrl="/templates/units-import-template.xlsx"
            />

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button onClick={() => setOpen(true)} className="gap-2">
                  {open ? (
                    <>
                      <Spinner className="h-4 w-4" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <IconPlus className="h-4 w-4" />
                      Add Unit
                    </>
                  )}
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-full sm:max-w-lg overflow-auto"
              >
                <SheetHeader>
                  <SheetTitle className="text-center">Add New Unit</SheetTitle>
                  <SheetDescription className="text-center">
                    Fill in unit information below.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 pb-10">
                  <AddUnitForm
                    onSuccess={() => {
                      setOpen(false);
                      refreshUnits();
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Edit Unit */}
          <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
            <SheetContent
              side="right"
              className="w-full sm:max-w-lg overflow-auto"
            >
              <SheetHeader>
                <SheetTitle className="text-center">Edit Unit</SheetTitle>
                <SheetDescription className="text-center">
                  Update the unit information below.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 pb-10">
                {editUnit && (
                  <EditUnitForm
                    unit={editUnit}
                    onSuccess={() => {
                      setIsEditOpen(false);
                      setEditUnit(null);
                      refreshUnits();
                    }}
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Add Ownership */}
          <Sheet open={isOwnershipOpen} onOpenChange={setIsOwnershipOpen}>
            <SheetContent
              side="right"
              className="w-full sm:max-w-lg overflow-auto"
            >
              <SheetHeader>
                <SheetTitle className="text-center">Add Owner</SheetTitle>
                <SheetDescription className="text-center">
                  Assign the unit owner below.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 pb-10">
                {addOwnership && (
                  <OwnershipForm
                    unitId={addOwnership.id as number}
                    onSuccess={() => {
                      setIsOwnershipOpen(false);
                      setAddOwnership(null);
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
              columnCount={8}
              filterCount={1}
              cellWidths={[
                "2rem",
                "2rem",
                "16rem",
                "12rem",
                "5rem",
                "4rem",
                "5rem",
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
      </Main>
    </>
  );
}
