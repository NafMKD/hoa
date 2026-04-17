import type { DocumentTemplate } from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@tanstack/react-router";
import { IconDownload } from "@tabler/icons-react";

export type DocumentTemplatesTableMeta = {
  isLoading: boolean;
  onDownloadDocx?: (template: DocumentTemplate) => void | Promise<void>;
  onDeleteRequest?: (template: DocumentTemplate) => void;
};

export const columns: ColumnDef<DocumentTemplate>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Name" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[220px] truncate font-medium">
        {row.getValue("name")}
      </div>
    ),
  },

  {
    accessorKey: "sub_category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Sub-category" />
    ),
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {String(row.getValue("sub_category") ?? "—")}
      </span>
    ),
  },

  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Category" />
    ),
  },

  {
    accessorKey: "version",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Version" />
    ),
    cell: ({ row }) => (
      <span className="tabular-nums">{String(row.getValue("version"))}</span>
    ),
  },

  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Created" />
    ),
  },

  {
    id: "actions",
    enableSorting: false,
    cell: ({ row, table }) => {
      const template = row.original;
      const meta = table.options.meta as DocumentTemplatesTableMeta;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link
                to="/admin/templates/$templateId"
                params={{ templateId: String(template.id) }}
                className="w-full cursor-pointer"
              >
                View details
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => void meta.onDownloadDocx?.(template)}
            >
              <IconDownload className="mr-2 h-4 w-4" />
              Download .docx
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => meta.onDeleteRequest?.(template)}
            >
              Delete template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 40,
  },
];
