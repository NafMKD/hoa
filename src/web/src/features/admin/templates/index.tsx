import { Main } from "@/components/layout/main";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

import {
  fetchDocumentTemplates,
  downloadDocumentTemplateFile,
  deleteDocumentTemplate,
} from "./lib/templates";
import { columns } from "./components/columns";
import type { DocumentTemplate } from "@/types/types";
import { AddDocumentTemplateForm } from "./components/add-template-form";
import { ConfirmDialog } from "@/components/confirm-dialog";
import type { ApiError } from "@/types/api-error";

const TEMPLATE_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "lease_agreement", label: "Lease agreement" },
  { value: "letter", label: "Letter" },
  { value: "reminder", label: "Reminder" },
  { value: "other", label: "Other" },
];

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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplate | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const refreshTemplates = useCallback(async () => {
    setIsLoading(true);
    const page = pagination.pageIndex + 1;

    const res = await fetchDocumentTemplates({
      page: page.toString(),
      perPage: pagination.pageSize.toString(),
      search: debouncedSearch,
      category: categoryFilter,
      order: sortOrder,
    });

    setData(res.data);
    setPageCount(res.meta.last_page);
    setIsLoading(false);

    setIsInitialLoading(false);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    debouncedSearch,
    categoryFilter,
    sortOrder,
  ]);

  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  const handleDownloadDocx = useCallback(async (template: DocumentTemplate) => {
    try {
      const base = `${template.sub_category}_v${template.version}`;
      await downloadDocumentTemplateFile(template.id, base);
      toast.success("Download started.");
    } catch (e) {
      const err = e as Error;
      toast.error(err.message || "Could not download file.");
    }
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocumentTemplate(deleteTarget.id);
      toast.success("Template deleted.");
      setDeleteTarget(null);
      await refreshTemplates();
    } catch (error) {
      const err = error as ApiError;
      toast.error(
        err.data && typeof err.data === "object" && "message" in err.data
          ? String((err.data as { message?: string }).message)
          : err.message || "Could not delete template."
      );
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, refreshTemplates]);

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
    meta: {
      isLoading,
      onDownloadDocx: handleDownloadDocx,
      onDeleteRequest: (t: DocumentTemplate) => setDeleteTarget(t),
    },
  });

  function CopyTag({ text }: { text: string }) {
    return (
      <span
        onClick={() => {
          void navigator.clipboard.writeText(text);
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

  const filterSlot = (
    <>
      <Select
        value={categoryFilter || "__all__"}
        onValueChange={(v) => setCategoryFilter(v === "__all__" ? "" : v)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All categories</SelectItem>
          {TEMPLATE_CATEGORY_OPTIONS.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={sortOrder}
        onValueChange={(v) => setSortOrder(v as "desc" | "asc")}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Sort by date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Newest first</SelectItem>
          <SelectItem value="asc">Oldest first</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <Main>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Document Templates
          </h2>
          <p className="text-muted-foreground">
            Versioned .docx library — search, filter, download, and upload new
            versions. Editing happens in Word (including Amharic); the app does
            not merge documents in the browser.
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
                Upload version
              </Button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-full sm:max-w-lg overflow-auto"
            >
              <SheetHeader>
                <SheetTitle className="text-center">
                  Upload template version
                </SheetTitle>
                <SheetDescription className="text-center">
                  Same category + sub-category gets the next version number
                  automatically if you leave version blank.
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
            columnCount={7}
            filterCount={2}
            cellWidths={[
              "2rem",
              "12rem",
              "10rem",
              "8rem",
              "5rem",
              "8rem",
              "4rem",
            ]}
            shrinkZero
          />
        ) : (
          <DataTable
            table={table}
            onChange={setSearch}
            searchValue={search}
            searchPlaceholder="Search name or sub-category…"
            filterSlot={filterSlot}
          />
        )}
      </div>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">
              Template guide
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground text-center mt-1">
              Download the .docx, edit offline (including Amharic), then upload
              a new version. Placeholders below apply when templates are used in
              lease flows.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <section className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Workflow</p>
              <p className="mt-2">
                Use <strong>Download .docx</strong> from the list or detail
                page. After editing in Microsoft Word, open{" "}
                <strong>Upload version</strong> and use the same category and
                sub-category — leave version empty to let the server pick the
                next number.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-lg">Lease document creation</h3>
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
              items={[{ label: "Name", value: "{{representative.full_name}}" }]}
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

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete this template version?"
        desc={
          deleteTarget
            ? `“${deleteTarget.name}” (v${deleteTarget.version}) will be removed. This cannot be undone.`
            : ""
        }
        handleConfirm={confirmDelete}
        isLoading={deleting}
        destructive
        confirmText="Delete"
      />
    </Main>
  );
}
