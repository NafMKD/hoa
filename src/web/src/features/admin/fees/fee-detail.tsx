import { useEffect, useState } from "react";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFeeDetail, terminate, getFeeStatusColor } from "./lib/fees";
import type { Fee } from "@/types/types";
import { Link, useParams } from "@tanstack/react-router";
import { IconArrowLeft, IconArrowLeftCircle, IconCalendar, IconAlertCircle, IconLoader2, IconX } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";

export function FeeDetail() {
  // ensure your router path matches this
  const { feeId } = useParams({ from: "/_authenticated/admin/financials/fees/$feeId" });
  const [fee, setFee] = useState<Fee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const loadFee = async () => {
      try {
        const data = await fetchFeeDetail(feeId as string);
        setFee(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadFee();
  }, [feeId]);

  // Currency Formatter
  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "ETB",
    }).format(Number(amount));
  };

  // Date Formatter
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const triggerConfirm = () => {
    setConfirmOpen(true);
  };

  const onConfirm = async() => {
    if (!fee) return;
    setIsProcessing(true);
    try {
      const updatedFee = await terminate(fee.id);
      toast.success("Fee marked as Terminated");

      if (updatedFee) setFee(updatedFee);
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.data?.message || "Action failed. Please try again.");
    } finally {
      setIsProcessing(false);
      setConfirmOpen(false);
    }
    
  };

  if (isLoading) {
    return (
      <Main className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-20" />
        </div>

        <Card className="border-muted shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 mt-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>
      </Main>
    );
  }

  if (!fee) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <p className="text-muted-foreground">Fee not found.</p>
          <Button asChild>
            <Link to="/admin/financials/fees">
              <IconArrowLeftCircle size={16} className="mr-1" />
              Back to Fees
            </Link>
          </Button>
        </div>
      </Main>
    );
  }

  return (
    <Main className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Fee Details</h1>
        <Button variant="outline" asChild>
          <Link to="/admin/financials/fees">
            <IconArrowLeft size={16} className="mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <Main className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Fee Details</h1>
          <div className="flex flex-wrap gap-2 items-center">
            {fee.status === "active" && (
              <Button
                variant="destructive"
                disabled={isProcessing}
                onClick={() => triggerConfirm()}
              >
                {isProcessing ? (
                  <IconLoader2 className="animate-spin h-4 w-4" />
                ) : (
                  <IconX size={16} className="mr-1" />
                )}
                Terminate
              </Button>
            )}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Terminate this Fee?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will mark the Fee as terminated. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onConfirm}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>{" "}
            <Button variant="outline" asChild>
              <Link to="/admin/financials/fees">
                <IconArrowLeft size={16} className="mr-1" />
                Back
              </Link>
            </Button>
          </div>
        </div>

        <Card className="border-muted shadow-sm">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-xl font-semibold leading-tight">
                    {fee.name}
                  </CardTitle>
                  <Badge variant="secondary" className="capitalize">
                    {fee.category
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                  <Badge variant="outline" className={`${getFeeStatusColor(fee.status)}`}>
                    {fee.status
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  Overview of fee structure and rules.
                </CardDescription>

                <div className="mt-2 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Frequency
                    </p>
                    <p className="text-sm font-medium break-all">
                      {fee.is_recurring
                        ? `Every ${fee.recurring_period_months} Month(s)`
                        : "One-time Charge"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Next Due
                    </p>
                    <p className="text-sm font-medium break-all">
                      {fee.is_recurring
                        ? formatDate(fee.next_recurring_date)
                        : "—"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Penalizable
                    </p>
                    <p className="text-sm font-medium break-all">
                      {fee.is_penalizable ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Created At
                    </p>
                    <p className="text-sm font-medium break-all">
                      {formatDate(fee.created_at)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Last Updated
                    </p>
                    <p className="text-sm font-medium break-all">
                      {formatDate(fee.updated_at)}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm font-medium break-all">
                    {formatDate(fee.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Side Stat Box - Amount */}
            <div className="grid w-full max-w-xs grid-cols-2 gap-3 rounded-lg border bg-muted/40 p-3 text-sm md:grid-cols-1">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Fee Amount
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(fee.amount)}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="flex flex-wrap gap-2 w-full">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
        </TabsList>

          <TabsContent value="config" className="mt-6 space-y-8">
            <section className="grid gap-4 md:grid-cols-2">
              {/* Recurring Logic Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    Recurring Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Is Recurring?</span>
                    <span className="font-medium">
                      {fee.is_recurring ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Interval</span>
                    <span className="font-medium">
                      {fee.is_recurring
                        ? fee.recurring_period_months
                          ? `${fee.recurring_period_months} Months`
                          : "N/A"
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">
                      Last Processed
                    </span>
                    <span className="font-medium">
                      {fee.is_recurring
                        ? formatDate(fee.last_recurring_date)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground">
                      Next Scheduled
                    </span>
                    <span className="font-medium">
                      {fee.is_recurring
                        ? formatDate(fee.next_recurring_date)
                        : "—"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Penalty Logic Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <IconAlertCircle className="h-4 w-4 text-muted-foreground" />
                    Penalty Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">
                      Can Incur Penalties?
                    </span>
                    <span
                      className={`font-medium ${fee.is_penalizable ? "text-destructive" : ""}`}
                    >
                      {fee.is_penalizable ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="pt-2">
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      {fee.is_penalizable
                        ? "If this fee is not paid by the due date, the system may generate penalty records based on global penalty settings."
                        : "Late payments for this fee will not trigger automatic system penalties."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          <TabsContent value="description" className="mt-6">
            {fee.description ? (
              <Card className="border-muted shadow-sm">
                <CardContent className="pt-6">
                  <p className="whitespace-pre-wrap">{fee.description}</p>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">
                No description available.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </Main>
    </>
  );
}