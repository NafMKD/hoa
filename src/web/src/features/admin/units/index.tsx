import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { fetchUnits } from "./lib/units";
import { columns } from "./components/columns";
import { DataTable } from "@/components/data-table/data-table";
import React, { useEffect, useState } from "react";
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
import { AddUnitForm } from "./components/add-unit-form";
import type { Unit } from "@/types/types";
import { IconPlus } from "@tabler/icons-react";
import { EditUnitForm } from "./components/edit-unit-form";

export function Units() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);
  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const page = pagination.pageIndex + 1;
      const res = await fetchUnits(
        page.toString(),
        pagination.pageSize.toString(),
        debouncedSearch
      );      
      setData(res.data);
      setPageCount(res.meta.last_page);
      setIsLoading(false);
    };

    fetchData();
  }, [pagination.pageIndex, pagination.pageSize, debouncedSearch]);

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
    meta: { setEditUnit, setIsEditOpen },
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
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Units</h2>
            <p className="text-muted-foreground">
              Manage residential and commercial units here.
            </p>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setOpen(true)}>
                <IconPlus className="mr-1 h-4 w-4" />
                Add Unit
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-lg overflow-auto">
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
                    const page = pagination.pageIndex + 1;
                    fetchUnits(
                      page.toString(),
                      pagination.pageSize.toString(),
                      debouncedSearch
                    ).then((res) => {
                      setData(res.data);
                      setPageCount(res.meta.last_page);
                    });
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
            <SheetContent side="right" className="w-full sm:max-w-lg overflow-auto">
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
                      const page = pagination.pageIndex + 1;
                      fetchUnits(
                        page.toString(),
                        pagination.pageSize.toString(),
                        debouncedSearch
                      ).then((res) => {
                        setData(res.data);
                        setPageCount(res.meta.last_page);
                      });
                    }}
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          {isLoading ? (
            <DataTableSkeleton
              columnCount={8}
              filterCount={1}
              cellWidths={[
                "6rem", "10rem", "10rem", "10rem",
                "10rem", "10rem", "10rem", "6rem",
              ]}
              shrinkZero
            />
          ) : (
            <DataTable table={table} onChange={setSearch} />
          )}
        </div>
      </Main>
    </>
  );
}
