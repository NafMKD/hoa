import type { BankStatementBatch } from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { getBatchStatusColor } from "../lib/reconciliation";

export const batchColumns: ColumnDef<BankStatementBatch>[] = [
  {
    accessorKey: "id",
    header: "Batch #",
    cell: ({ row }) => <span className="font-medium">#{row.original.id}</span>,
  },
  {
    accessorKey: "file_name",
    header: "File",
    cell: ({ row }) => (
      <span className="truncate max-w-[180px] block" title={row.original.file_name}>
        {row.original.file_name}
      </span>
    ),
  },
  {
    accessorKey: "row_count",
    header: "Rows",
  },
  {
    accessorKey: "uploaded_at",
    header: "Uploaded",
    cell: ({ row }) =>
      row.original.uploaded_at
        ? new Date(row.original.uploaded_at).toLocaleDateString()
        : "—",
  },
  {
    id: "admin",
    header: "Uploaded By",
    cell: ({ row }) => row.original.admin?.full_name ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant="outline" className={`capitalize border ${getBatchStatusColor(status)}`}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link
        to="/admin/financials/reconciliation/$batchId"
        params={{ batchId: row.original.id.toString() }}
      >
        <Button variant="ghost" size="sm">
          <Eye className="mr-1 h-4 w-4" /> View
        </Button>
      </Link>
    ),
  },
];
