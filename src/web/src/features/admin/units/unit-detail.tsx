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
import { fetchUnitDetail, changeUnitStatus } from "./lib/units";
import type { Unit, UnitLeaseResource, UnitOwnership } from "@/types/types";
import { Link, useParams } from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconArrowLeftCircle,
  IconFileText,
  IconEye,
} from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ApiError } from "@/types/api-error";
import { InvoiceList } from "./components/invoices/invoice-list";
import { AddInvoiceModal } from "../invoices/components/add-invoice-modal";

function getFileType(url?: string | null): "image" | "pdf" | "unknown" {
  if (!url) return "unknown";
  const lower = url.toLowerCase();
  if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp")
  ) {
    return "image";
  }
  if (lower.endsWith(".pdf")) {
    return "pdf";
  }
  return "unknown";
}

type PreviewFile = {
  title: string;
  url: string;
};

export function UnitDetail() {
  const { unitId } = useParams({
    from: "/_authenticated/admin/units/$unitId/",
  });
  const [unit, setUnit] = useState<Unit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [unitStatus, setUnitStatus] = useState<string>("");
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUnitDetail(unitId as string);
      setUnit(data);
      setUnitStatus(data.status || "");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitId]);

  const owners = (unit as Unit)?.owners ?? [];

  const leases = unit?.leases ?? [];

  const invoices = unit?.invoices ?? [];

  const ownersCount = owners?.length ?? 0;
  const leasesCount = leases?.length ?? 0;
  const invoicesCount = invoices?.length ?? 0;

  const handleOpenPreview = (file: PreviewFile | null) => {
    setPreviewFile(file);
  };

  const handleChangeStatus = async () => {
    if (!unit) return;
    if (!unitStatus) {
      toast.error("Please select a valid status.");
      return;
    }
    try {
      setIsSaving(true);
      await changeUnitStatus(unitId, unitStatus);
      setUnit((prev) => (prev ? { ...prev, status: unitStatus } : prev));
      setStatusModal(false);
      toast.success("Unit status updated successfully.");
    } catch (err) {
      const error = err as ApiError;
      if (error.status === 400 && error.data) {
        toast.error(`${error.data?.message}`);
        return
      }
      toast.error("Failed to update unit status.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <Main className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-20" />
        </div>

        <Card className="border-muted shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-60" />
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

  if (!unit) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <p className="text-muted-foreground">Unit not found.</p>
          <Button asChild>
            <Link to="/admin/units">
              <IconArrowLeftCircle size={16} className="mr-1" />
              Back to Units
            </Link>
          </Button>
        </div>
      </Main>
    );
  }

  return (
    <>
      <Main className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                      Unit Details
                      {unit.have_issue && (
                        <Badge
                          variant="destructive"
                          className="text-xs font-medium rounded-full px-2 py-0.5"
                        >
                          Have an issue
                        </Badge>
                      )}
                    </h1>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <AddInvoiceModal
                    onSuccess={refreshData}
                    unitId={Number(unitId)}
                  />
                  <Button variant="outline" asChild>
            <Link to="/admin/units">
              <IconArrowLeft size={16} className="mr-1" />
              Back
            </Link>
          </Button>
                </div>
              </div>

        {/* --- UNIT SNAPSHOT CARD (more elegant / structured) --- */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <span>Unit - {unit.name || `#${unit.id}`}</span>
                {unit.status && (
                  <Badge
                    variant="outline"
                    className="text-xs font-medium rounded-full px-2 py-0.5"
                  >
                    {unit.status
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Clean snapshot of key unit information
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 rounded-full border px-3 py-1">
                <span className="font-medium">Owners</span>
                <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {ownersCount}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-full border px-3 py-1">
                <span className="font-medium">Leases</span>
                <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {leasesCount}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-full border">
                <Button
                  variant="secondary"
                  className="bg:primary text-white hover:bg-primary/90 rounded-full px-3 py-1"
                  size="sm"
                  onClick={() => setStatusModal(true)}
                >
                  Change Status
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t pt-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Building
              </p>
              <p className="font-medium">
                {unit.building ? (
                  <Link
                    to="/admin/buildings/$buildingId"
                    params={{ buildingId: unit.building.id as string }}
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    {unit.building.name}
                  </Link>
                ) : (
                  "—"
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Floor
              </p>
              <p className="font-medium">{unit.floor_name ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Unit Type
              </p>
              <p className="font-medium">{unit.type_name || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Size (m²)
              </p>
              <p className="font-medium">{unit.size_m2 || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Created At
              </p>
              <p className="font-medium">{unit.created_at || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Updated At
              </p>
              <p className="font-medium">{unit.updated_at || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* --- OWNERS / LEASES TABS (elegant + obvious + functional) --- */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
              Relationships
            </CardTitle>
            <CardDescription>
              Owners and lease history for this unit.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <Tabs defaultValue="invoices" className="w-full">
              <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:inline-flex bg-muted/50">
                  <TabsTrigger
                    value="invoices"
                    className="flex items-center gap-2"
                  >
                    <span>Invoices</span>
                    <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-background text-xs font-semibold border">
                      {invoicesCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="owners"
                    className="flex items-center gap-2"
                  >
                    <span>Owners</span>
                    <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-background text-xs font-semibold border">
                      {ownersCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="leases"
                    className="flex items-center gap-2"
                  >
                    <span>Leases</span>
                    <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-background text-xs font-semibold border">
                      {leasesCount}
                    </span>
                  </TabsTrigger>
                </TabsList>

                <div className="text-xs text-muted-foreground">
                  Click on a file to preview ownership or lease documents.
                </div>
              </div>

              {/* INVOICES TAB */}
              <TabsContent value="invoices" className="mt-4">
                {invoicesCount === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No invoices are recorded for this unit yet.
                  </p>
                ) : (
                  <InvoiceList invoices={invoices} invoicesCount={invoicesCount} />
                )}
              </TabsContent>

              {/* OWNERS TAB */}
              <TabsContent value="owners" className="mt-4">
                {ownersCount === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No owners are recorded for this unit yet.
                  </p>
                ) : (
                  <div className="rounded-lg border bg-muted/10 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/60">
                      <p className="text-sm font-medium">
                        Owners history
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({ownersCount} total)
                        </span>
                      </p>
                    </div>
                    <div className="max-h-[420px] overflow-auto">
                      <Table>
                        <TableHeader className="bg-muted/40 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-[35%]">Name</TableHead>
                            <TableHead className="w-[18%]">
                              Start date
                            </TableHead>
                            <TableHead className="w-[18%]">End date</TableHead>
                            <TableHead className="w-[15%] text-center">
                              File
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {owners.map((unit_ownership: UnitOwnership) => {
                            const docUrl =
                              unit_ownership.ownership_document?.url || null;
                            const docName =
                              unit_ownership.ownership_document?.file_name ||
                              "Ownership document";

                            return (
                              <TableRow
                                key={unit_ownership.id}
                                className="hover:bg-muted/40"
                              >
                                <TableCell className="font-medium">
                                  {unit_ownership.owner?.full_name || "—"}
                                  {unit_ownership.status === "Active" && (
                                    <span className="ml-5">
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-500 text-white dark:bg-green-600"
                                      >
                                        {unit_ownership.status}
                                      </Badge>
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {unit_ownership.start_date || "—"}
                                </TableCell>
                                <TableCell>
                                  {unit_ownership.end_date || "—"}
                                </TableCell>
                                <TableCell className="text-center">
                                  {docUrl ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="inline-flex items-center gap-1 text-xs"
                                      onClick={() =>
                                        handleOpenPreview({
                                          title: docName,
                                          url: docUrl,
                                        })
                                      }
                                    >
                                      <IconEye size={14} />
                                      <span>View</span>
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* LEASES TAB */}
              <TabsContent value="leases" className="mt-4">
                {leasesCount === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No leases have been recorded for this unit yet.
                  </p>
                ) : (
                  <div className="rounded-lg border bg-muted/10 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/60">
                      <p className="text-sm font-medium">
                        Lease history
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({leasesCount} total)
                        </span>
                      </p>
                    </div>
                    <div className="max-h-[420px] overflow-auto">
                      <Table>
                        <TableHeader className="bg-muted/40 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-[35%]">
                              Name / Tenant
                            </TableHead>
                            <TableHead className="w-[18%]">
                              Start date
                            </TableHead>
                            <TableHead className="w-[18%]">End date</TableHead>
                            <TableHead className="w-[15%] text-center">
                              Action
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leases.map((lease: UnitLeaseResource) => {
                            const displayName =
                              lease.tenant?.full_name || `Lease #${lease.id}`;

                            return (
                              <TableRow
                                key={lease.id}
                                className="hover:bg-muted/40"
                              >
                                <TableCell className="font-medium">
                                  {displayName}
                                  {lease.status && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      ({lease.status})
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {lease.lease_start_date || "—"}
                                </TableCell>
                                <TableCell>
                                  {lease.lease_end_date || "—"}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="inline-flex items-center gap-1 text-xs"
                                    asChild
                                  >
                                    <Link
                                      to={`/admin/units/$unitId/leases/$leaseId`}
                                      params={{
                                        unitId: unit.id.toString(),
                                        leaseId: lease.id.toString(),
                                      }}
                                    >
                                      <IconEye size={14} />
                                      <span>View</span>
                                    </Link>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </Main>

      {/* FILE PREVIEW MODAL */}
      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => !open && handleOpenPreview(null)}
      >
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <IconFileText size={18} />
              <span>
                {previewFile?.title
                  ? previewFile.title.split(".")[0].toUpperCase()
                  : "Document preview"}
              </span>
            </DialogTitle>
            <DialogDescription>
              Preview of the selected document file.
            </DialogDescription>
          </DialogHeader>
          {previewFile && (
            <div className="mt-2">
              {getFileType(previewFile.url) === "image" && (
                <img
                  src={previewFile.url}
                  alt={previewFile.title}
                  className="max-h-[70vh] w-full object-contain rounded-md border bg-muted"
                />
              )}
              {getFileType(previewFile.url) === "pdf" && (
                <iframe
                  src={previewFile.url}
                  className="h-[70vh] w-full rounded-md border bg-muted"
                />
              )}
              {getFileType(previewFile.url) === "unknown" && (
                <div className="text-sm text-muted-foreground">
                  Cannot preview this file type.
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    Open in a new tab
                  </a>
                  .
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status */}
      <Dialog open={statusModal} onOpenChange={setStatusModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Unit Status</DialogTitle>
            <DialogDescription>
              Select a new status for this unit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <select
              className="w-full border px-3 py-2 rounded-md text-sm"
              defaultValue={unit.status}
              onChange={(e) => setUnitStatus(e.target.value)}
            >
              <option value="rented">Rented</option>
              <option value="owner_occupied">Owner Occupied</option>
              <option value="vacant">Vacant</option>
            </select>

            <Button
              disabled={isSaving}
              className="bg-primary text-white hover:bg-primary/90 w-full"
              onClick={async () => handleChangeStatus()}
            >
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
