import type { Unit } from "@/types/types";
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

export const columns: ColumnDef<Unit>[] = [
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
    header: ({ column }) => <DataTableColumnHeader column={column} label="ID" />,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Unit Name" />
    ),
  },
  {
    accessorKey: "building.name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Building" />
    ),
  },
  {
    accessorKey: "floor_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Floor" />
    ),
  },
  {
    accessorKey: "size_m2",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Area (sqm)" />
    ),
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
      const unit = row.original;
      const { setEditUnit, setIsEditOpen } = table.options.meta as {
        setEditUnit: React.Dispatch<React.SetStateAction<Unit | null>>;
        setIsEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
      };

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
                to="/admin/units/$unitId"
                params={{ unitId: unit.id as string }}
                className="w-full cursor-pointer"
              >
                View Unit Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {unit.isRentable && (
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/units/$unitId/leases"
                  params={{ unitId: unit.id as string }}
                  className="w-full cursor-pointer"
                >
                  Create Lease
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              onClick={() => {
                setEditUnit(unit);
                setIsEditOpen(true);
              }}
            >
              Edit Unit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 40,
  },
];
