import { useEffect, useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { useParams, Link } from "@tanstack/react-router";
import {
  addReceiptNumber,
  confirmPayment,
  failPayment,
  fetchPaymentDetail,
  getPaymentStatusColor,
  refundPayment,
} from "./lib/payments";
import type { Payment } from "@/types/types";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconArrowLeft,
  IconPrinter,
  IconFileInvoice,
  IconUser,
  IconCreditCard,
  IconCalendarEvent,
  IconPhoto,
  IconDownload,
  IconLoader2,
  IconX,
  IconCheck,
  IconArrowBackUp,
} from "@tabler/icons-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import { PrintableReceipt } from "./components/printable-receipt";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PaymentDetail() {
  const { paymentId } = useParams({
    // Adjust route path as per your router config
    from: "/_authenticated/admin/financials/payments/$paymentId",
  });
  const [payment, setPayment] = useState<Payment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "confirm" | "fail" | "refund" | null
  >(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("");

  // Print Logic
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Receipt-${payment?.reference}`,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchPaymentDetail(paymentId);
        setPayment(data);
      } catch (error) {
        console.error("Failed to load payment", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [paymentId]);

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

  const triggerConfirm = (action: "confirm" | "fail" | "refund") => {
    setPendingAction(action);
    setConfirmOpen(true);
  };

  const onConfirm = () => {
    if (pendingAction) {
      handleAction(pendingAction);
    }
    setConfirmOpen(false);
  };

  const getDialogDetails = () => {
    switch (pendingAction) {
      case "confirm":
        return {
          title: "Confirm Payment?",
          desc: "This will mark the payment as verified and deduct the amount from the invoice balance.",
          btnClass: "bg-green-600 hover:bg-green-700",
        };
      case "fail":
        return {
          title: "Reject Payment?",
          desc: "This will mark the payment as failed. The user will be notified.",
          btnClass:
            "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        };
      case "refund":
        return {
          title: "Issue Refund?",
          desc: "This will mark the payment as refunded. Ensure you have returned the funds to the user.",
          btnClass: "bg-purple-600 hover:bg-purple-700",
        };
      default:
        return {
          title: "Are you sure?",
          desc: "This action cannot be undone.",
          btnClass: "",
        };
    }
  };

  const dialogContent = getDialogDetails();

  const handleAction = async (action: "confirm" | "fail" | "refund") => {
    if (!payment) return;
    setIsProcessing(true);
    try {
      let updatedPayment;

      if (action === "confirm") {
        updatedPayment = await confirmPayment(payment.id);
        toast.success("Payment confirmed successfully");
      } else if (action === "fail") {
        updatedPayment = await failPayment(payment.id);
        toast.success("Payment marked as failed");
      } else if (action === "refund") {
        updatedPayment = await refundPayment(payment.id);
        toast.info("Payment refunded");
      }

      if (updatedPayment) setPayment(updatedPayment);
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Action failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <PaymentDetailSkeleton />;
  if (!payment)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Payment not found
      </div>
    );

  const submitReceiptNumber = async () => {
    if (!payment || !receiptNumber.trim()) return;

    setIsProcessing(true);
    try {
      const updatedPayment = await addReceiptNumber(
        payment.id,
        receiptNumber.trim()
      );

      setPayment(updatedPayment);
      setReceiptOpen(false);
      setReceiptNumber("");

      toast.success("Receipt number added");
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Failed to add receipt number");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
      <Main className="container mx-auto px-4 py-6 space-y-8">
        {/* Top Navigation & Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                Ref. # - {payment.reference}
                <Badge
                  variant="outline"
                  className={`text-sm px-2 py-0.5 rounded-full ${getPaymentStatusColor(payment.status)}`}
                >
                  {payment.status}
                </Badge>
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {/* --- BUTTONS LOGIC --- */}
            {/* Case 1: PENDING -> Show Confirm or Fail */}
            {payment.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  disabled={isProcessing}
                  onClick={() => triggerConfirm("fail")}
                >
                  {isProcessing ? (
                    <IconLoader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <IconX size={16} className="mr-1" />
                  )}
                  Reject
                </Button>

                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isProcessing}
                  onClick={() => triggerConfirm("confirm")}
                >
                  {isProcessing ? (
                    <IconLoader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <IconCheck size={16} className="mr-1" />
                  )}
                  Confirm
                </Button>
              </>
            )}
            {/* Case 2: CONFIRMED -> Show Refund */}
            {payment.status === "confirmed" && (
              <Button
                variant="secondary"
                className="border-purple-200 text-white"
                disabled={isProcessing}
                onClick={() => triggerConfirm("refund")}
              >
                {isProcessing ? (
                  <IconLoader2 className="animate-spin h-4 w-4" />
                ) : (
                  <IconArrowBackUp size={16} className="mr-1" />
                )}
                Refund
              </Button>
            )}
            {payment.status === "confirmed" && !payment.receipt_number && (
              <Button
                variant="outline"
                onClick={() => setReceiptOpen(true)}
                disabled={isProcessing}
              >
                <IconFileInvoice size={16} className="mr-1" />
                Add Receipt #
              </Button>
            )}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {dialogContent.desc}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onConfirm}
                    className={dialogContent.btnClass}
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={receiptOpen} onOpenChange={setReceiptOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Add Receipt Number</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter the official receipt number for this completed
                    payment.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <input
                  autoFocus
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && receiptNumber.trim()) {
                      submitReceiptNumber();
                    }
                  }}
                  placeholder="Receipt number"
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={!receiptNumber.trim() || isProcessing}
                    onClick={submitReceiptNumber}
                  >
                    {isProcessing ? (
                      <IconLoader2 className="animate-spin h-4 w-4" />
                    ) : (
                      "Save"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {/* Standard Navigation Buttons */}
            <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>{" "}
            {/* Separator */}
            <Button variant="outline" asChild disabled={isProcessing}>
              <Link to="/admin/financials/payments">
                <IconArrowLeft size={16} className="mr-1" />
                Back
              </Link>
            </Button>
            <Button
              onClick={handlePrint}
              variant="default"
              className="gap-2 shadow-sm"
              disabled={isProcessing}
            >
              <IconPrinter size={16} /> Print
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
          {/* LEFT COLUMN: Main Payment Content */}
          <div className="md:col-span-2 lg:col-span-3 space-y-6">
            {/* 1. Header Information Card (Context) */}
            <Card className="border-none shadow-sm bg-muted/30">
              <CardContent className="p-6">
                <div className="grid sm:grid-cols-2 gap-8">
                  {/* Payer Info (Derived from Invoice) */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <IconUser size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Payer Details
                      </span>
                    </div>
                    <p className="font-semibold text-lg">
                      {payment.invoice?.user ? (
                        <Link
                          to={`/admin/users/$userId`}
                          params={{
                            userId: payment.invoice.user.id.toString(),
                          }}
                          target="_blank"
                          className="hover:underline"
                        >
                          {payment.invoice.user.full_name}
                        </Link>
                      ) : (
                        "Unknown Payer"
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.invoice?.user?.email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.invoice?.user?.phone}
                    </p>
                  </div>

                  {/* Related Invoice Details */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <IconFileInvoice size={16} />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Applied To
                      </span>
                    </div>
                    <p className="font-semibold text-lg">
                      {payment.invoice ? (
                        <Link
                          to={`/admin/financials/invoices/$invoiceId`}
                          params={{ invoiceId: payment.invoice.id.toString() }}
                          className="hover:underline text-primary"
                        >
                          {payment.invoice.invoice_number}
                        </Link>
                      ) : (
                        `Ref: ${payment.reference}`
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Original Inv Amount:{" "}
                      {payment.invoice ? (
                        <b>{formatMoney(payment.invoice.total_amount)}</b>
                      ) : (
                        "—"
                      )}
                      <br />
                      {payment.invoice?.penalty_amount && (
                        <>
                          Penalty Amount:{" "}
                          <b>{formatMoney(payment.invoice.penalty_amount)}</b>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Transaction Details */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Transaction Details
                  </CardTitle>
                  { payment.receipt_number && (
                  <div className="text-sm text-muted-foreground">
                    Receipt # —{" "}
                    <span className="ml-1 font-mono font-bold text-foreground">
                      {payment.receipt_number}
                    </span>
                  </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="w-[40%] pl-6 font-medium text-muted-foreground">
                        Payment Method
                      </TableCell>
                      <TableCell className="capitalize font-medium">
                        {payment.method.replace(/_/g, " ")}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent">
                      <TableCell className="pl-6 font-medium text-muted-foreground">
                        Reference / Transaction ID
                      </TableCell>
                      <TableCell className="font-mono">
                        {payment.reference}
                      </TableCell>
                    </TableRow>
                    {payment.reconciliation_metadata && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell className="pl-6 font-medium text-muted-foreground">
                          Reconciliation Note
                        </TableCell>
                        <TableCell>
                          {JSON.stringify(payment.reconciliation_metadata)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* 3. Proof of Payment (Screenshot) */}
            {payment.screenshot ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconPhoto size={18} className="text-muted-foreground" />
                    Proof of Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-md p-4 bg-muted/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded flex items-center justify-center text-primary">
                        <IconPhoto size={20} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          Payment Screenshot
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Uploaded Document
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <IconDownload size={14} /> Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
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
                    <span className="text-sm">Payment Date</span>
                  </div>
                  <span className="font-medium text-sm">
                    {formatDate(payment.payment_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconCreditCard
                      size={16}
                      className="text-muted-foreground"
                    />
                    <span className="text-sm">Processed At</span>
                  </div>
                  <span
                    className={`font-medium text-sm ${getPaymentStatusColor(payment.status)}`}
                  >
                    {payment.processed_at
                      ? formatDate(payment.processed_at)
                      : "Pending"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary Card */}
            <Card className="bg-muted/20 border-primary/20 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/40 pb-4 border-b">
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Invoice Total</span>
                  <span>
                    {payment.invoice ? (
                      <b>
                        {formatMoney(
                          parseFloat(payment.invoice.total_amount as string) +
                            parseFloat(payment.invoice.penalty_amount as string)
                        )}
                      </b>
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    Amount Received
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatMoney(payment.amount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden Print Component */}
        <div style={{ display: "none" }}>
          <div ref={printRef}>
            <PrintableReceipt payment={payment} />
          </div>
        </div>
      </Main>
  );
}

function PaymentDetailSkeleton() {
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

            {/* Transaction Details */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base">
                  <Skeleton className="h-5 w-32" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
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