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
import { Plus, Upload, Download, Filter } from "lucide-react";
import {
  Bar,
  Line
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

type Payroll = {
  id: number;
  employee: string;
  department: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: "Paid" | "Pending";
  payDate: string;
};

const demoPayroll: Payroll[] = Array.from({ length: 20 }, (_, i) => {
  const base = 1000 + i * 50;
  const bonus = Math.floor(Math.random() * 500);
  const deductions = Math.floor(Math.random() * 200);
  return {
    id: i + 1,
    employee: `Employee ${i + 1}`,
    department: ["HR", "Finance", "Maintenance", "Security"][i % 4],
    baseSalary: base,
    bonus,
    deductions,
    netSalary: base + bonus - deductions,
    status: i % 3 === 0 ? "Pending" : "Paid",
    payDate: `2025-09-${(i % 28) + 1}`
  };
});

const columns: ColumnDef<Payroll>[] = [
  { accessorKey: "employee", header: "Employee" },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "baseSalary", header: "Base Salary", cell: ({ row }) => `$${row.original.baseSalary}` },
  { accessorKey: "bonus", header: "Bonus", cell: ({ row }) => `$${row.original.bonus}` },
  { accessorKey: "deductions", header: "Deductions", cell: ({ row }) => `$${row.original.deductions}` },
  { accessorKey: "netSalary", header: "Net Salary", cell: ({ row }) => `$${row.original.netSalary}` },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          status === "Paid" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
        }`}>{status}</span>
      );
    }
  },
  { accessorKey: "payDate", header: "Pay Date" },
];

export default function Payroll() {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: demoPayroll,
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

  // Chart Data
  const barData = {
    labels: demoPayroll.map(p => p.employee),
    datasets: [
      { label: "Net Salary", data: demoPayroll.map(p => p.netSalary), backgroundColor: "rgba(34,197,94,0.6)" },
      { label: "Deductions", data: demoPayroll.map(p => p.deductions), backgroundColor: "rgba(239,68,68,0.6)" },
    ]
  };

  const lineData = {
    labels: demoPayroll.map(p => p.employee),
    datasets: [
      { label: "Bonus", data: demoPayroll.map(p => p.bonus), borderColor: "rgba(34,197,94,0.8)", backgroundColor: "rgba(34,197,94,0.2)" },
      { label: "Base Salary", data: demoPayroll.map(p => p.baseSalary), borderColor: "rgba(59,130,246,0.8)", backgroundColor: "rgba(59,130,246,0.2)" }
    ]
  };

  const chartOptions = { responsive: true, plugins: { legend: { position: "top" as const } } };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex space-x-2">
          <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Payroll</Button>
          <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Advanced Filter</Button>
        </div>
        <Input
          placeholder="Search employee..."
          value={(table.getColumn("employee")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("employee")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No payroll records found.</TableCell></TableRow>
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

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="w-full h-[400px]"><Bar data={barData} options={chartOptions} /></div>
        <div className="w-full h-[400px]"><Line data={lineData} options={chartOptions} /></div>
      </div>
    </div>
  );
}
