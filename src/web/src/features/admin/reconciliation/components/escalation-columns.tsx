import type { ReconciliationEscalation } from "@/types/types";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(value));

export const escalationColumns: ColumnDef<ReconciliationEscalation>[] = [
  {
    accessorKey: "id",
    header: "#",
    cell: ({ row }) => <span className="font-medium">#{row.original.id}</span>,
  },
  {
    id: "payment",
    header: "Payment",
    cell: ({ row }) => {
      const p = row.original.payment;
      if (!p) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{p.reference}</span>
          <span className="text-xs text-muted-foreground">{formatCurrency(p.amount)}</span>
        </div>
      );
    },
  },
  {
    id: "bank_transaction",
    header: "Bank Txn",
    cell: ({ row }) => {
      const bt = row.original.bank_transaction;
      if (!bt) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{bt.reference || "No ref"}</span>
          <span className="text-xs text-muted-foreground">{formatCurrency(bt.amount)}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="capitalize text-sm">{row.original.reason.replace(/_/g, " ")}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      return (
        <Badge
          variant="outline"
          className={`capitalize border ${
            s === "pending"
              ? "bg-amber-100 text-amber-700 border-amber-200"
              : "bg-green-100 text-green-700 border-green-200"
          }`}
        >
          {s}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
  },
];
