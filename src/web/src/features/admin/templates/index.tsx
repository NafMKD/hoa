import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { useEffect, useState, useCallback } from "react";
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
import { IconHelp, IconPlus } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

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
  
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [data, setData] = useState<DocumentTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 600);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const refreshTemplates = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;

    const res = await fetchDocumentTemplates(
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
    refreshTemplates();
  }, [refreshTemplates]);

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
    meta: { isLoading },
  });

  function CopyTag({ text }: { text: string }) {
    return (
      <span
        onClick={() => {
          navigator.clipboard.writeText(text);
          toast(`Copied ${text} to clipboard!`);
        }}
        className="cursor-pointer px-2 py-0.5 rounded-md bg-muted text-xs hover:bg-muted/70"
      >
        {text}
      </span>
    );
  }

  function HelpSection({
    title,
    items,
  }: {
    title: string;
    items: { label: string; value: string }[];
  }) {
    return (
      <section>
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          {items.map((item, i) => (
            <p key={i}>
              {item.label}: <CopyTag text={item.value} />
            </p>
          ))}
        </div>
      </section>
    );
  }

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
            <h2 className="text-2xl font-bold tracking-tight">
              Document Templates
            </h2>
            <p className="text-muted-foreground">
              Manage system document templates here.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setHelpOpen(true)}
              className="gap-2"
            >
              <IconHelp className="h-4 w-4" />
              Help
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button onClick={() => setOpen(true)} className="gap-2">
                  <IconPlus className="h-4 w-4" />
                  Add Template
                </Button>
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-full sm:max-w-lg overflow-auto"
              >
                <SheetHeader>
                  <SheetTitle className="text-center">
                    Add New Template
                  </SheetTitle>
                  <SheetDescription className="text-center">
                    Fill in template information below.
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-6 pb-10">
                  <AddDocumentTemplateForm
                    onSuccess={() => {
                      setOpen(false);
                      refreshTemplates();
                    }}
                  />
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
              cellWidths={["2rem", "2rem", "12rem", "8rem", "2rem", "4rem"]}
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

        <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-bold">
                Template Variable Guide
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground text-center mt-1">
                Click any variable to copy it to your clipboard.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <section>
                <h3 className="font-semibold text-lg">
                  Lease Document Creation
                </h3>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p>
                    Category Name: <CopyTag text="lease_agreement" />
                  </p>
                  <p>
                    Sub Category Name: <CopyTag text="lease_agreement" />
                  </p>
                </div>
              </section>

              <HelpSection
                title="Owner Information"
                items={[
                  { label: "Owner Name", value: "{{unit.owner.full_name}}" },
                  { label: "City", value: "{{unit.owner.city}}" },
                  { label: "Sub City", value: "{{unit.owner.sub_city}}" },
                  { label: "Woreda", value: "{{unit.owner.woreda}}" },
                  {
                    label: "House Number",
                    value: "{{unit.owner.house_number}}",
                  },
                  { label: "Phone Number", value: "{{unit.owner.phone}}" },
                ]}
              />

              <HelpSection
                title="Representative Information"
                items={[
                  { label: "Name", value: "{{representative.full_name}}" },
                ]}
              />

              <HelpSection
                title="Tenant Information"
                items={[
                  { label: "Name", value: "{{tenant.full_name}}" },
                  { label: "City", value: "{{tenant.city}}" },
                  { label: "Sub City", value: "{{tenant.sub_city}}" },
                  { label: "Woreda", value: "{{tenant.woreda}}" },
                  { label: "House Number", value: "{{tenant.house_number}}" },
                  { label: "Phone Number", value: "{{tenant.phone}}" },
                ]}
              />
              <HelpSection
                title="House Details"
                items={[
                  { label: "Block", value: "{{unit.building.name}}" },
                  { label: "Unit Number", value: "{{unit.name}}" },
                  { label: "Unit Type", value: "{{unit.unit_type}}" },
                ]}
              />

              <HelpSection
                title="Lease Details"
                items={[
                  { label: "Lessor Name", value: "{{unit.lessor.name}}" },
                  { label: "Lease Amount", value: "{{agreement_amount}}" },
                  {
                    label: "Lease Amount (Words)",
                    value: "{{amount_in_words}}",
                  },
                  { label: "Lease Term", value: "{{lease_term_in_years}}" },
                  { label: "Today Date", value: "{{today_date}}" },
                ]}
              />
              <HelpSection
                title="Witnesses"
                items={[
                  { label: "Witness 1", value: "{{witness_1_full_name}}" },
                  { label: "Witness 2", value: "{{witness_2_full_name}}" },
                ]}
              />
            </div>
          </DialogContent>
        </Dialog>
      </Main>
    </>
  );
}