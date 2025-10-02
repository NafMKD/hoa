// Roles.tsx
import { useState } from "react";
import { type ColumnDef, useReactTable, type SortingState, type ColumnFiltersState, type VisibilityState, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, getFacetedRowModel, getFacetedUniqueValues } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Upload, Download, Filter } from "lucide-react";

type Role = {
  id: number;
  name: string;
  permissions: string;
  createdAt: string;
};

const demoRoles: Role[] = [
  { id: 1, name: "Admin", permissions: "All", createdAt: "2025-01-01" },
  { id: 2, name: "Accountant", permissions: "Financials", createdAt: "2025-02-01" },
  { id: 3, name: "Secretary", permissions: "User Management", createdAt: "2025-03-01" },
  { id: 4, name: "Homeowner", permissions: "View Dashboard", createdAt: "2025-04-01" },
  { id: 5, name: "Tenant", permissions: "View Dashboard", createdAt: "2025-05-01" },
];

const columns: ColumnDef<Role>[] = [
  { accessorKey: "name", header: "Role Name" },
  { accessorKey: "permissions", header: "Permissions" },
  { accessorKey: "createdAt", header: "Created At" },
];

export default function Roles() {
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [open, setOpen] = useState(false);

  const table = useReactTable({
    data: demoRoles,
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
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Role</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Role</DialogTitle>
                <DialogDescription>Define role and permissions.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <Input placeholder="Role Name" />
                <Input placeholder="Permissions" />
              </div>
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import Excel</Button>
          <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Excel</Button>
          <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Advanced Filter</Button>
        </div>
        <Input
          placeholder="Search role..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(e) => table.getColumn("name")?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />
      </div>

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
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No roles found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
