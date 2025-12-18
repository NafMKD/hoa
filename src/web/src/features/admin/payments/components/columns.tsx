import type { Payment } from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { getPaymentStatusColor } from "../lib/payments";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, FileText } from "lucide-react";
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

export const columns: ColumnDef<Payment>[] = [
  
  {
    id: "invoice",
    header: "Invoice #",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <Link
          to="/admin/financials/invoices/$invoiceId"
          params={{ invoiceId: row.original.invoice.id.toString() }}
          target="_blank"
          className="hover:underline font-medium text-primary"
        >
          {row.original.invoice.invoice_number}
        </Link>
        <span
          className="text-xs text-muted-foreground truncate max-w-[120px]"
          title={row.original.reference}
        >
          Ref: {row.original.reference}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "full_name",
    header: "Full Name",
    cell: ({ row }) => (
      <div className="flex flex-col space-y-1">
        <span className="font-medium">
          {row.original.invoice.user ? (
            <Link
              to="/admin/users/$userId"
              params={{ userId: row.original.invoice.user?.id.toString() }}
              target="_blank"
              className="hover:underline font-medium text-primary"
            >{row.original.invoice.user.full_name}</Link>
          ) : (
            "N/A"
          )}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[200px]">
          {row.original.invoice.unit ? (
              <Link
                to="/admin/units/$unitId"
                params={{ unitId: row.original.invoice.unit?.id.toString() }}
                target="_blank"
                className="hover:underline font-medium text-primary"
              >{row.original.invoice.unit.name}</Link>
            ) : (
              "N/A"
            )}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.method.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Amount" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(row.getValue("amount"))}
      </span>
    ),
  },
  {
    accessorKey: "payment_date",
    header: "Date",
    cell: ({ row }) =>
      new Date(row.getValue("payment_date")).toLocaleDateString(),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant="outline"
          className={`capitalize border ${getPaymentStatusColor(status)}`}
        >
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
              <Link
                to="/admin/financials/payments/$paymentId"
                params={{ paymentId: row.original.id.toString() }}
              >
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            {row.original.screenshot && (
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" /> View Receipt
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];