import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import {
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
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
import { IconPlus } from "@tabler/icons-react";

import { fetchDocumentTemplates } from "./lib/templates";
import { columns } from "./components/columns";
import type { DocumentTemplate } from "@/types/types";
import { AddDocumentTemplateForm } from "./components/add-template-form";

export function DocumentTemplates() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [pageCount, setPageCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DocumentTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const page = pagination.pageIndex + 1;

      const res = await fetchDocumentTemplates(
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
    onRowSelectionChange: setRowSelection
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
            <h2 className="text-2xl font-bold tracking-tight">Document Templates</h2>
            <p className="text-muted-foreground">
              Manage system document templates here.
            </p>
          </div>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button onClick={() => setOpen(true)}>
                <IconPlus className="mr-1 h-4 w-4" />
                Add Template
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-full sm:max-w-lg overflow-auto">
              <SheetHeader>
                <SheetTitle className="text-center">Add New Template</SheetTitle>
                <SheetDescription className="text-center">
                  Fill in template information below.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 pb-10">
                <AddDocumentTemplateForm
                  onSuccess={() => {
                    setOpen(false);
                    const page = pagination.pageIndex + 1;
                    fetchDocumentTemplates(
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
        </div>

        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          {isLoading ? (
            <DataTableSkeleton
              columnCount={6}
              filterCount={1}
              cellWidths={["6rem", "10rem", "20rem", "20rem", "10rem", "6rem"]}
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
