import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useParams, Link } from "@tanstack/react-router";
import { fetchInvoiceDetail, getStatusColor } from "./lib/invoices";
import type { Invoice } from "@/types/types";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconArrowLeft,
  IconPrinter,
  IconBuildingSkyscraper,
  IconUser,
  IconCreditCard,
  IconCalendarEvent,
} from "@tabler/icons-react";
import { PrintableInvoice } from "./components/printable-invoice";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getPaymentStatusColor } from "../payments/lib/payments";
import { AddPaymentModal } from "../payments/components/add-payment-modal";
import { AddPenaltyModal } from "./components/add-penalty-modal";
import { isLegacyMetadata, getString, getObject, getNumber, getStringArray, formatFeeCategory } from "./lib/utils";

export function InvoiceDetail() {
  const { invoiceId } = useParams({
    from: "/_authenticated/admin/financials/invoices/$invoiceId",
  });
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Print Logic
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Invoice-${invoice?.invoice_number}`,
  });

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchInvoiceDetail(invoiceId);
      setInvoice(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const formatMoney = (val: number | string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(Number(val));

  const formatDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
      : "—";

  if (isLoading) return <InvoiceDetailSkeleton />;
  if (!invoice)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Invoice not found
      </div>
    );

  return (
    <Main className="container mx-auto px-4 py-6 space-y-8">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              {invoice.invoice_number}
              <Badge
                variant="outline"
                className={`text-sm px-2 py-0.5 rounded-full ${getStatusColor(invoice.status)}`}
              >
                {invoice.status}
              </Badge>
            </h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {invoice.status === "issued" || invoice.status === "partial" ? (
            <>
              <AddPenaltyModal
                onSuccess={refreshData}
                invoiceId={Number(invoiceId)}
              />
              <AddPaymentModal
                onSuccess={refreshData}
                invoiceId={Number(invoiceId)}
              />
              <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>
            </>
          ) : null}
          <Button variant="outline" asChild>
            <Link to="/admin/financials/invoices">
              <IconArrowLeft size={16} className="mr-1" />
              Invoices
            </Link>
          </Button>
          <Button
            onClick={handlePrint}
            variant="default"
            className="gap-2 shadow-sm"
          >
            <IconPrinter size={16} /> Print Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* LEFT COLUMN: Main Invoice Content */}
        <div className="md:col-span-2 lg:col-span-3 space-y-6">
          {/* 1. Header Information Card */}
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 gap-8">
                {/* Bill To */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <IconUser size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Bill To
                    </span>
                  </div>
                  <p className="font-semibold text-lg">
                    {invoice.user ? (
                      <Link
                        to={`/admin/users/$userId`}
                        params={{ userId: invoice.user.id.toString() }}
                        target="_blank"
                        className="hover:underline"
                      >
                        {invoice.user.full_name}
                      </Link>
                    ) : (
                      "Unknown User"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.user?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.user?.phone}
                  </p>
                </div>
                {/* Property Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <IconBuildingSkyscraper size={16} />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Property Unit
                    </span>
                  </div>
                  <p className="font-semibold text-lg">
                    {invoice.unit ? (
                      <Link
                        to={`/admin/units/$unitId`}
                        params={{ unitId: invoice.unit.id.toString() }}
                        target="_blank"
                        className="hover:underline"
                      >
                        {invoice.unit.name}
                      </Link>
                    ) : (
                      "General Invoice"
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {invoice.unit?.building?.name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Line Items Breakdown */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">Invoice Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[60%] pl-6">Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="pl-6 font-medium">
                      {invoice.source?.name ||
                        invoice.source_type.split("\\").pop()}
                      {invoice.source?.description && (
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          {invoice.source.description}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">1</TableCell>
                    <TableCell className="text-right pr-6">
                      {formatMoney(invoice.total_amount)}
                    </TableCell>
                  </TableRow>

                  {invoice.penalties &&
                    invoice.penalties.length > 0 &&
                    invoice.penalties.map((penalty) => (
                      <TableRow key={penalty.id}>
                        <TableCell className="pl-6 font-medium">
                          Penalty
                          <span className="block text-xs text-muted-foreground mt-0.5">
                            {penalty.reason || "No reason provided"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">1</TableCell>
                        <TableCell className="text-right pr-6">
                          {formatMoney(penalty.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 3. Payment History (Only if payments exist) */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <IconCreditCard size={18} className="text-muted-foreground" />
                  Payment History
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex justify-between items-center border-b last:border-0 pb-3 last:pb-0"
                    >
                      <div className="space-y-1">
                        <Link
                          to="/admin/financials/payments/$paymentId"
                          params={{ paymentId: payment.id.toString() }}
                          target="_blank"
                        >
                          Payment Received
                        </Link>

                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.payment_date)} • via{" "}
                          {payment.method
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                        </p>

                        {/* status + type */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize ${getPaymentStatusColor(payment.status)}`}
                          >
                            {payment.status}
                          </span>

                          <span className="px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                            {payment.type}
                          </span>
                        </div>
                      </div>

                      <span className="font-semibold text-green-600">
                        -{formatMoney(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Summary & Dates */}
        <div className="md:col-span-1 space-y-6">
          {/* Dates Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCalendarEvent
                    size={16}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm">Issued Date</span>
                </div>
                <span className="font-medium text-sm">
                  {formatDate(invoice.issue_date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconCalendarEvent size={16} className="text-red-400" />
                  <span className="text-sm">Due Date</span>
                </div>
                <span className="font-medium text-sm">
                  {formatDate(invoice.due_date)}
                </span>
              </div>
            </CardContent>
          </Card>

          {isLegacyMetadata(invoice.metadata) && (
            <Collapsible defaultOpen={false}>
              <Card className="border-primary/20 shadow-sm overflow-hidden">
                {/* HEADER (clickable) */}
                <CardHeader className="bg-muted/40 pb-4 border-b">
                  <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-base">
                          Legacy Details
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px]">
                          Legacy
                        </Badge>
                      </div>

                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                </CardHeader>

                {/* CONTENT (collapsed by default) */}
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {/* Invoice Snapshot */}
                    {(() => {
                      const invoiceSnap = getObject(
                        invoice.metadata,
                        "invoice_snapshot",
                      );
                      if (!invoiceSnap) return null;

                      const months = getStringArray(
                        invoiceSnap,
                        "invoice_months",
                      );
                      if (!months) return null;

                      return (
                        <Card className="bg-muted/20 border-border shadow-none">
                          <CardContent className="p-4 space-y-2">
                            <div className="text-xs font-semibold uppercase text-muted-foreground">
                              Invoice Snapshot
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-sm text-muted-foreground">
                                Months
                              </span>
                              <span className="text-sm font-medium">
                                <ul className="space-y-1 text-sm font-medium">
                                  {months.map((m) => (
                                    <li
                                      key={m}
                                      className="rounded-sm px-2 py-1 hover:bg-muted transition-colors"
                                    >
                                      {m}
                                    </li>
                                  ))}
                                </ul>
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}

                    {/* Fee Snapshot */}
                    {(() => {
                      const feeSnap = getObject(
                        invoice.metadata,
                        "fee_snapshot",
                      );
                      if (!feeSnap) return null;

                      const feeName = getString(feeSnap, "name");
                      const feeCategory = getString(feeSnap, "category");
                      const feeAmount = getNumber(feeSnap, "amount");

                      return (
                        <Card className="bg-muted/20 border-border shadow-none">
                          <CardContent className="p-4 space-y-2">
                            <div className="text-xs font-semibold uppercase text-muted-foreground">
                              Fee Snapshot
                            </div>

                            <div className="flex justify-between text-sm gap-3">
                              <span className="text-muted-foreground">
                                Name
                              </span>
                              <span className="font-medium text-right">
                                {feeName ?? "—"}
                              </span>
                            </div>

                            <div className="flex justify-between text-sm gap-3">
                              <span className="text-muted-foreground">
                                Category
                              </span>
                              <span className="font-medium text-right">
                                {formatFeeCategory(feeCategory)}
                              </span>
                            </div>

                            <div className="flex justify-between text-sm gap-3">
                              <span className="text-muted-foreground">
                                Amount
                              </span>
                              <span className="font-medium text-right">
                                {feeAmount != null
                                  ? formatMoney(feeAmount)
                                  : "—"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })()}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Financial Summary Card */}
          <Card className="bg-muted/20 border-primary/20 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/40 pb-4 border-b">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatMoney(invoice.total_amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Penalty</span>
                <span className="text-red-600">
                  +{formatMoney(invoice.penalty_amount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="text-green-600">
                  -{formatMoney(invoice.amount_paid)}
                </span>
              </div>

              <Separator className="my-2" />

              <div className="flex flex-col gap-1 pt-1">
                <span className="text-xs font-semibold uppercase text-muted-foreground">
                  Balance Due
                </span>
                <span
                  className={`text-2xl font-bold ${(invoice.final_amount_due as number) > 0 ? "text-primary" : "text-green-600"}`}
                >
                  {formatMoney(invoice.final_amount_due)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hidden Print Component */}
      <div style={{ display: "none" }}>
        <div ref={printRef}>
          <PrintableInvoice invoice={invoice} />
        </div>
      </div>
    </Main>
  );
}

function InvoiceDetailSkeleton() {
  return (
    <Main className="container mx-auto px-4 py-6 space-y-8">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* LEFT COLUMN */}
        <div className="md:col-span-2 lg:col-span-3 space-y-6">
          {/* Header Information Card */}
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-44" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-52" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items Breakdown */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base">
                <Skeleton className="h-5 w-28" />
              </CardTitle>
            </CardHeader>

            <CardContent className="p-0">
              <div className="p-6">
                {/* Table header row */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <Skeleton className="h-4 col-span-7" />
                  <Skeleton className="h-4 col-span-2 justify-self-end" />
                  <Skeleton className="h-4 col-span-3 justify-self-end" />
                </div>

                {/* Table body rows */}
                <div className="mt-5 space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-12 gap-3 items-center">
                      <Skeleton className="h-4 col-span-7" />
                      <Skeleton className="h-4 col-span-2 justify-self-end" />
                      <Skeleton className="h-4 col-span-3 justify-self-end" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-1 space-y-6">
          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-muted/20 border-primary/20 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/40 pb-4 border-b">
              <CardTitle className="text-base">
                <Skeleton className="h-5 w-24" />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between text-sm">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between text-sm">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>

              <Separator className="my-2" />

              <div className="flex flex-col gap-2 pt-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-40" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Main>
  );
}

