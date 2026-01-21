import type { Vehicle } from "@/types/types";
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
import { Eye } from "lucide-react";

export const columns: ColumnDef<Vehicle>[] = [
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
    id: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Vehicle" />,
    cell: ({ row }) => {
      return (
        <div className="flex flex-col space-y-1">
          <span className="font-medium">
            {row.original.make} {row.original.model}
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {row.original.license_plate}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "unit",
    header: "Unit",
    cell: ({ row }) => {
      return (
        <div className="capitalize">
            { row.original.unit !== undefined ? (

            <Link to="/admin/units/$unitId" params={{ unitId: row.original.unit.id.toString() }} target="_blank" className="text-sm underline">
                {row.original.unit.name ?? `N/A`}
            </Link>
            ) : (
                <span className="text-sm">N/A</span>
            )}
        </div>
      );
    },
  },
  {
    accessorKey: "license_plate",
    header: ({ column }) => <DataTableColumnHeader column={column} label="License Plate" />,
    cell: ({ row }) => {
      return <div className="font-medium tracking-wide">{row.getValue("license_plate")}</div>;
    },
  },
  {
    accessorKey: "year",
    header: "Year",
    cell: ({ row }) => {
      const year: number | string = row.getValue("year");
      return <div className="text-muted-foreground">{year}</div>;
    },
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ row }) => {
      const color: string | null = row.getValue("color");
      return color ? (
        <div className="flex items-center gap-2">
          <span className="text-sm capitalize">{color}</span>
          <span
            aria-hidden
            className="h-3 w-3 rounded-full border"
            style={{ backgroundColor: color }}
          />
        </div>
      ) : (
        <div className="text-muted-foreground">—</div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const vehicle: Vehicle = row.original;
      const { setEditVehicle, setIsEditOpen } = table.options.meta as {
        setEditVehicle: React.Dispatch<React.SetStateAction<Vehicle | null>>;
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
                to="/admin/vehicles/$vehicleId"
                params={{ vehicleId: vehicle.id.toString() }}
                className="w-full cursor-pointer flex items-center gap-2"
              >
                <Eye className="h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => {
                setEditVehicle(vehicle);
                setIsEditOpen(true);
              }}
            >
              Edit Vehicle
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 40,
  },
];
