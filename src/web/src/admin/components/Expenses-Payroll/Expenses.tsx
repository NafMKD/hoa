import { useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
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
import { Input } from "@/components/ui/input";
import { Download, Upload, Filter, Plus } from "lucide-react";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

type Expense = {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  paidBy: string;
  status: "Paid" | "Pending" | "Overdue";
};

const demoExpenses: Expense[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  date: `2025-09-${(i % 28) + 1}`,
  category: ["Maintenance", "Utilities", "Supplies", "Payroll"][i % 4],
  description: `Expense description ${i + 1}`,
  amount: Math.floor(Math.random() * 2000) + 100,
  paidBy: `Staff ${i % 5 + 1}`,
  status: i % 3 === 0 ? "Paid" : i % 3 === 1 ? "Pending" : "Overdue",
}));

const columns: ColumnDef<Expense>[] = [
  { accessorKey: "date", header: "Date" },
  { accessorKey: "category", header: "Category" },
  { accessorKey: "description", header: "Description" },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => `$${row.original.amount.toFixed(2)}`,
  },
  { accessorKey: "paidBy", header: "Paid By" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            status === "Paid"
              ? "bg-green-100 text-green-800"
              : status === "Pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },
];

export default function Expenses() {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: demoExpenses,
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex space-x-2">
          <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
          <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Advanced Filter</Button>
        </div>
        <Input
          placeholder="Search description or category..."
          value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("description")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No expenses found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
        <span className="text-sm">Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
      </div>
    </div>
  );
}
