import type { Invoice } from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { getStatusColor } from "../lib/invoices";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatCurrency = (value: number | string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
  }).format(Number(value));
};

export const columns: ColumnDef<Invoice>[] = [
  {
    accessorKey: "invoice_number",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Invoice #" />,
    cell: ({ row }) => <span className="font-mono font-medium">{row.getValue("invoice_number")}</span>,
  },
  {
    id: "user",
    header: "Billed To",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.user?.full_name || "Unknown"}</span>
        <span className="text-xs text-muted-foreground">{row.original.unit?.name || "No Unit"}</span>
      </div>
    ),
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Amount" />,
    cell: ({ row }) => <span className="font-medium">{formatCurrency(row.getValue("total_amount"))}</span>,
  },
  {
    accessorKey: "issue_date",
    header: "Date",
    cell: ({ row }) => new Date(row.getValue("issue_date")).toLocaleDateString(),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge variant="outline" className={`capitalize border ${getStatusColor(status)}`}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/admin/financials/invoices/$invoiceId" params={{ invoiceId: row.original.id.toString() }}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];