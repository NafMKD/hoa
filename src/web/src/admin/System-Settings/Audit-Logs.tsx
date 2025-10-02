// Audit-Logs.tsx
import { useState } from "react";
import { type ColumnDef, useReactTable, type SortingState, type ColumnFiltersState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

type AuditLog = {
  id: number;
  user: string;
  action: string;
  ipAddress: string;
  timestamp: string;
};

const demoLogs: AuditLog[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  user: `User ${i + 1}`,
  action: ["Login", "Logout", "Update", "Delete"][i % 4],
  ipAddress: `192.168.0.${i + 1}`,
  timestamp: `2025-09-${(i % 28) + 1} 10:${i % 60}:00`,
}));

const columns: ColumnDef<AuditLog>[] = [
  { accessorKey: "user", header: "User" },
  { accessorKey: "action", header: "Action" },
  { accessorKey: "ipAddress", header: "IP Address" },
  { accessorKey: "timestamp", header: "Timestamp" },
];

export default function AuditLogs() {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: demoLogs,
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
      <Input
        placeholder="Search user or action..."
        value={(table.getColumn("user")?.getFilterValue() as string) ?? ""}
        onChange={(e) => table.getColumn("user")?.setFilterValue(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(header => <TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>)}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No audit logs found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
