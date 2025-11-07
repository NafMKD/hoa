import type { Building } from "@/types/types";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "@tanstack/react-router";

export const columns: ColumnDef<Building>[] = [
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
      <DataTableColumnHeader column={column} label="Building Name" />
    ),
  },
  {
    accessorKey: "floors",
    header: "# Floors",
  },
  {
    accessorKey: "units_per_floor",
    header: "# Units",
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
      const building = row.original;
      const { setEditBuilding, setIsEditOpen } = table.options.meta as {
        setEditBuilding: React.Dispatch<React.SetStateAction<Building | null>>;
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
                to="/admin/buildings/$buildingId"
                params={{ buildingId: building.id as string }}
                className="w-full cursor-pointer"
              >
                View Building Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => {
                setEditBuilding(building);
                setIsEditOpen(true);
              }}
            >
              Edit Building
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 40,
  },
];
