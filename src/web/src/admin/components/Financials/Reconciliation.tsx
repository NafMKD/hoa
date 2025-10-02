import { useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Upload, Filter } from "lucide-react";

type Reconciliation = {
  id: number;
  refNo: string;
  account: string;
  transactions: number;
  matched: number;
  unmatched: number;
  status: "Balanced" | "Discrepancy";
};

const demoReconciliations: Reconciliation[] = Array.from({ length: 15 }, (_, i) => {
    const transactions = 50 + i * 3;
    const isBalanced = Math.random() > 0.5;
    const matched = isBalanced ? transactions : transactions - Math.floor(Math.random() * 5 + 1);
    const unmatched = transactions - matched;
    const status = unmatched > 0 ? "Discrepancy" : "Balanced";
  
    return {
      id: i + 1,
      refNo: `REC-${3000 + i}`,
      account: `Account ${i + 1}`,
      transactions,
      matched,
      unmatched,
      status,
    };
  });

const columns: ColumnDef<Reconciliation>[] = [
  { accessorKey: "refNo", header: "Ref No" },
  { accessorKey: "account", header: "Account" },
  { accessorKey: "transactions", header: "Transactions" },
  { accessorKey: "matched", header: "Matched" },
  { accessorKey: "unmatched", header: "Unmatched" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        row.original.status === "Balanced" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}>{row.original.status}</span>
    ),
  },
];
interface DashboardProps {
    setBreadcrumb: (breadcrumb: React.ReactNode) => void;
  }


export default function Reconciliation({ setBreadcrumb }: DashboardProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: demoReconciliations,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button>
        <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
        <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Advanced Filter</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
