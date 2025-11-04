import type { User } from "@/types/user";
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
import { DataTableColumnHeader } from "./data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox"
import { Link } from "@tanstack/react-router";

export const columns: ColumnDef<User>[] = [
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
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="ID" />
    ),
  },
  {
    accessorKey: "full_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Full Name" />
    ),
    cell: ({ row }) => `${row.original.first_name} ${row.original.last_name}`,
  },
  {
    accessorKey: "phone",
    header: "Phone Number",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      // display role with badge
      const role =
        row.original.role.charAt(0).toUpperCase() + row.original.role.slice(1);
      return <Badge variant="outline">{role}</Badge>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      
      const status = row.original.status;
      let variant: "default" | "secondary" | "destructive" | "outline" = "default";
      let className: string = "";

      if (status === "active") {
        variant = "secondary";
        className = "bg-green-100 text-green-800";
      } else if (status === "inactive") {
        variant = "secondary";
        className="bg-yellow-100 text-yellow-800";
      } else if (status === "suspended") {
        variant = "destructive";
      }
      return <Badge variant={variant} className={className}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
    }
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Created At" />
    ),
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const user = row.original;
      const USER_STATUSES = ["active", "inactive", "suspended"] as const;
      const availableStatuses = USER_STATUSES.filter(s => s !== user.status);
  
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
                to="/admin/users/$userId"
                params={{ userId: user.id as string }}
                className="w-full cursor-pointer"
              >
                View User Details
              </Link>
            </DropdownMenuItem>
  
            <DropdownMenuSeparator />
  
            {availableStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => {
                  table.options.meta?.onStatusChange?.(user.id, status);
                }}
              >
                Set status: {status.charAt(0).toUpperCase() + status.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 40,
  }
];
