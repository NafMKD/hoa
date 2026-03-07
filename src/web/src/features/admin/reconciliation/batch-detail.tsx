import { useEffect, useState } from "react";
import { useParams, Link } from "@tanstack/react-router";
import { fetchBatchDetail, getTransactionStatusColor, getBatchStatusColor } from "./lib/reconciliation";
import type { BankStatementBatch } from "@/types/types";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

const formatCurrency = (value: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "ETB" }).format(Number(value));

export function BatchDetail() {
  const { batchId } = useParams({
    from: "/_authenticated/admin/financials/reconciliation/$batchId",
  });
  const [batch, setBatch] = useState<BankStatementBatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBatchDetail(batchId);
        setBatch(data);
      } catch (error) {
        console.error("Failed to load batch", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [batchId]);

  if (isLoading) return <BatchDetailSkeleton />;
  if (!batch)
    return (
      <div className="p-8 text-center text-muted-foreground">Batch not found</div>
    );

  const transactions = batch.transactions ?? [];
  const matched = transactions.filter((t) => t.status === "matched").length;
  const escalated = transactions.filter((t) => t.status === "escalated").length;
  const unmatched = transactions.filter((t) => t.status === "unmatched").length;

  return (
    <Main className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            Batch #{batch.id}
            <Badge
              variant="outline"
              className={`capitalize border ${getBatchStatusColor(batch.status)}`}
            >
              {batch.status}
            </Badge>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {batch.file_name} &middot; {batch.row_count} rows &middot;
            Uploaded {batch.uploaded_at ? new Date(batch.uploaded_at).toLocaleDateString() : "—"}
            {batch.admin ? ` by ${batch.admin.full_name}` : ""}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/admin/financials/reconciliation">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-green-600">{matched}</div>
            <div className="text-sm text-muted-foreground">Matched</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-amber-600">{unmatched}</div>
            <div className="text-sm text-muted-foreground">Unmatched</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-2xl font-bold text-red-600">{escalated}</div>
            <div className="text-sm text-muted-foreground">Escalated</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-base">Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Matched Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No transactions in this batch.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-sm">
                      {txn.reference || "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(txn.amount)}
                    </TableCell>
                    <TableCell>
                      {txn.transaction_date
                        ? new Date(txn.transaction_date).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm" title={txn.description}>
                      {txn.description || "—"}
                    </TableCell>
                    <TableCell>
                      {txn.matched_payment ? (
                        <Link
                          to="/admin/financials/payments/$paymentId"
                          params={{ paymentId: txn.matched_payment.id.toString() }}
                          className="text-primary hover:underline text-sm"
                        >
                          {txn.matched_payment.reference}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize border ${getTransactionStatusColor(txn.status)}`}
                      >
                        {txn.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Main>
  );
}

function BatchDetailSkeleton() {
  return (
    <Main className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 text-center space-y-2">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="pb-3 border-b">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </Main>
  );
}
