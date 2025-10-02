// Lost-Replacement.tsx
import { useState } from "react";
import {
  type ColumnDef,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Upload, Download, Filter } from "lucide-react";

type LostReplacement = {
  id: number;
  vehicle: string;
  type: "Lost" | "Replacement";
  requestDate: string;
  status: "Pending" | "Approved" | "Rejected";
};

const demoLostReplacement: LostReplacement[] = Array.from(
  { length: 20 },
  (_, i) => ({
    id: i + 1,
    vehicle: `Vehicle ${i + 1}`,
    type: i % 2 === 0 ? "Lost" : "Replacement",
    requestDate: `2025-09-${(i % 28) + 1}`,
    status: i % 3 === 0 ? "Pending" : i % 3 === 1 ? "Approved" : "Rejected",
  })
);

const columns: ColumnDef<LostReplacement>[] = [
  { accessorKey: "vehicle", header: "Vehicle" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "requestDate", header: "Request Date" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          row.original.status === "Approved"
            ? "bg-green-100 text-green-800"
            : row.original.status === "Pending"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {row.original.status}
      </span>
    ),
  },
];

export default function LostReplacement() {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [open, setOpen] = useState(false);

  const table = useReactTable({
    data: demoLostReplacement,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex space-x-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Lost/Replacement Request</DialogTitle>
                <DialogDescription>
                  Fill in request details below.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <Input placeholder="Vehicle" />
                <Input placeholder="Type (Lost/Replacement)" />
                <Input placeholder="Request Date" />
                <Input placeholder="Status" />
              </div>
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" /> Import Excel
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Excel
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" /> Advanced Filter
          </Button>
        </div>
        <Input
          placeholder="Search vehicle..."
          value={(table.getColumn("vehicle")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("vehicle")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
