import type { Expense } from "@/types/types";
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
import { Badge } from "@/components/ui/badge";
import { getExpenseStatusStyle } from "../lib/expenses";

export const columns: ColumnDef<Expense>[] = [
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
    accessorKey: "description",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Description" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[240px] truncate font-medium">
        {row.getValue("description")}
      </div>
    ),
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.category?.name ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Amount" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(String(row.getValue("amount")));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "ETB",
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    id: "vendor",
    header: "Vendor",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.vendor?.name ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const label = status.replace(/_/g, " ");
      return (
        <Badge
          variant="outline"
          className={`capitalize border ${getExpenseStatusStyle(status)}`}
        >
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "expense_date",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Expense date" />
    ),
    cell: ({ row }) => {
      const d = row.getValue("expense_date") as string;
      return (
        <span className="text-muted-foreground">
          {d ? new Date(d).toLocaleDateString() : "—"}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const expense = row.original;
      const meta = table.options.meta as {
        setEditExpense: React.Dispatch<React.SetStateAction<Expense | null>>;
        setIsEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
        onDelete: (e: Expense) => void;
        canEdit: (e: Expense) => boolean;
        canDelete: (e: Expense) => boolean;
      };

      const showEdit = meta.canEdit(expense);
      const showDelete = meta.canDelete(expense);

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
            {showEdit && (
              <DropdownMenuItem
                onClick={() => {
                  meta.setEditExpense(expense);
                  meta.setIsEditOpen(true);
                }}
              >
                Edit expense
              </DropdownMenuItem>
            )}
            {showDelete && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => meta.onDelete(expense)}
              >
                Delete expense
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 40,
  },
];
