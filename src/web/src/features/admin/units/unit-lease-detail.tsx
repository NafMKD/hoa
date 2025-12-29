import { useEffect, useMemo, useState } from "react"
import { Main } from "@/components/layout/main"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Link, useParams } from "@tanstack/react-router"
import {
  IconArrowLeft,
  IconArrowLeftCircle,
  IconFileText,
  IconEye,
  IconId,
  IconUser,
  IconHome,
  IconNotes,
  IconCalendarEvent,
  IconBriefcase,
} from "@tabler/icons-react"
import { toast } from "sonner"

// You can adjust these imports to match your actual API module names.
import {
  fetchUnitLeaseDetail,
  activateUnitLease,
  terminateUnitLease
} from "./lib/units"
import type { UnitLeaseResource } from "@/types/types"


// Simple helper to guess file type by extension
function getFileType(url?: string | null): "image" | "pdf" | "unknown" {
  if (!url) return "unknown"
  const lower = url.toLowerCase()
  if (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".webp")
  ) {
    return "image"
  }
  if (lower.endsWith(".pdf")) {
    return "pdf"
  }
  return "unknown"
}

function humanize(value?: string | null) {
  if (!value) return "—"
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatMoney(val?: number | string | null) {
  if (val === null || val === undefined || val === "") return "—"
  const num = typeof val === "string" ? Number(val) : val
  if (!Number.isFinite(num)) return String(val)
  // Keep it lightweight: no currency hardcoding if you support multi-currency.
  return new Intl.NumberFormat().format(num)
}

function formatDateRange(start?: string | null, end?: string | null) {
  if (!start && !end) return "—"
  if (start && end) return `${start} → ${end}`
  return start || end || "—"
}

type PreviewFile = {
  title: string
  url: string
}

type FileRef = {
  id: string | number;
  url: string;
  file_name?: string;
  name?: string;
};

export function UnitLeaseDetail() {
  const { unitId, leaseId } = useParams({
    from: "/_authenticated/admin/units/$unitId/leases/$leaseId/",
  })

  const [lease, setLease] = useState<UnitLeaseResource | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null)

  useEffect(() => {
    const loadLease = async () => {
      try {
        const data = await fetchUnitLeaseDetail(unitId as string, leaseId as string)
        setLease(data)
      } catch (e) {
        toast.error("Failed to load lease details.")
      } finally {
        setIsLoading(false)
      }
    }
    loadLease()
  }, [unitId, leaseId])

  const unit = useMemo(() => lease?.unit ?? null, [lease])
  const tenant = useMemo(() => lease?.tenant ?? null, [lease])
  const representative = useMemo(() => lease?.representative ?? null, [lease])
  const currentOwner = useMemo(() => unit?.currentOwner ?? null, [unit])

  const docs = useMemo(() => {
    const list: Array<{ label: string; file?: FileRef | null; fallbackName?: string }> = [
      { label: "Lease document", file: lease?.lease_document, fallbackName: "Lease document" },
      { label: "Lease template", file: lease?.lease_template, fallbackName: "Lease template" },
      {
        label: "Representative document",
        file: lease?.representative_document,
        fallbackName: "Representative document",
      }
    ]
    return list
  }, [lease, currentOwner])

  const documentsCount = useMemo(() => {
    return docs.filter((d) => d.file?.url).length
  }, [docs])

  const witnesses = useMemo(
    () =>
      [
        lease?.witness_1_full_name,
        lease?.witness_2_full_name,
        lease?.witness_3_full_name,
      ].filter(Boolean) as string[],
    [lease]
  )

  const handleOpenPreview = (file: PreviewFile | null) => setPreviewFile(file)

  const handleActivate = async (leaseId: number) => {
    if (!lease) return;

    try {
      setIsSaving(true);
      await activateUnitLease(unitId as string, leaseId.toString());
      setLease((prev) => (prev ? { ...prev, status: "active" } : prev));
      toast.success("Lease activated successfully.");
    } catch (error: any) {
      if (error?.status === 400 && error?.data) {
        toast.error(`${error.data?.message}`);
        return;
      }
      toast.error("Failed to activate lease.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTerminate = async (leaseId: number) => {
    if (!lease) return;

    try {
      setIsSaving(true);
      await terminateUnitLease(unitId as string, leaseId.toString());
      setLease((prev) => (prev ? { ...prev, status: "terminated" } : prev));
      toast.success("Lease terminated successfully.");
    } catch (error: any) {
      if (error?.status === 400 && error?.data) {
        toast.error(`${error.data?.message}`);
        return;
      }
      toast.error("Failed to terminate lease.");
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------- LOADING STATE -----------------
  if (isLoading) {
    return (
      <Main className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-9 w-28" />
        </div>

        <Card className="border-muted shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-56 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mt-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-muted shadow-sm">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-full" />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </Main>
    )
  }

  // ----------------- NOT FOUND STATE -----------------
  if (!lease) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <p className="text-muted-foreground">Lease not found.</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="outline" asChild>
              <Link to="/admin/units/$unitId" params={{ unitId: unitId as string }}>
                <IconArrowLeftCircle size={16} className="mr-1" />
                Back to Unit
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/units">
                <IconArrowLeft size={16} className="mr-1" />
                Units List
              </Link>
            </Button>
          </div>
        </div>
      </Main>
    )
  }

  // ----------------- MAIN UI -----------------
  return (
    <>
      <Main className="container mx-auto px-4 py-6 space-y-8">
        {/* Top bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Unit Lease Details
            </h1>
            <p className="text-sm text-muted-foreground">
              Agreement snapshot, parties, documents, and timeline.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link
                to="/admin/units/$unitId"
                params={{ unitId: unitId as string }}
              >
                <IconArrowLeft size={16} className="mr-1" />
                Back to Unit
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/units">
                <IconArrowLeft size={16} className="mr-1" />
                Units
              </Link>
            </Button>
          </div>
        </div>

        {/* --- LEASE SNAPSHOT CARD --- */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <span>Lease - {lease.id ? `#${lease.id}` : "Record"}</span>
                {lease.status && (
                  <Badge
                    variant="outline"
                    className="text-xs font-medium rounded-full px-2 py-0.5"
                  >
                    {humanize(lease.status)}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Clean summary of primary lease information.
              </CardDescription>
            </div>

            <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 rounded-full border px-3 py-1">
                <span className="font-medium">Documents</span>
                <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {documentsCount}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-full border px-3 py-1">
                <span className="font-medium">Witnesses</span>
                <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {witnesses.length}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-full border">
                {lease.status === "active" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-full px-3 py-1"
                    onClick={() => handleTerminate(lease.id as number)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Terminating..." : "Terminate Lease"}
                  </Button>
                ) : lease.status === "draft" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-emerald-500 text-white hover:bg-emerald-50 hover:text-black rounded-full px-3 py-1"
                    onClick={() => handleActivate(lease.id as number)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Activating..." : "Activate Lease"}
                  </Button>
                ) : null}
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-t pt-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Unit
              </p>
              <p className="font-medium flex items-center gap-2">
                <IconHome size={14} className="text-muted-foreground" />
                {unit ? (
                  <Link
                    to="/admin/units/$unitId"
                    params={{ unitId: String(unit.id ?? unitId) }}
                    className="text-primary hover:underline"
                  >
                    {unit.name || `#${unit.id}`}
                  </Link>
                ) : (
                  "—"
                )}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Building
              </p>
              <p className="font-medium">
                {unit?.building ? (
                  <Link
                    to="/admin/buildings/$buildingId"
                    params={{ buildingId: String(unit.building.id) }}
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    {unit.building.name || "—"}
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
              <p className="font-medium">
                {unit?.floor_name ?? unit?.floor_number ?? "—"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Unit Type
              </p>
              <p className="font-medium">
                {unit?.type_name ?? unit?.unit_type ?? "—"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Size (m²)
              </p>
              <p className="font-medium">{unit?.size_m2 ?? "—"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Agreement Type
              </p>
              <p className="font-medium flex items-center gap-2">
                <IconBriefcase size={14} className="text-muted-foreground" />
                {humanize(lease.agreement_type)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Agreement Amount
              </p>
              <p className="font-medium">
                {formatMoney(lease.agreement_amount)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Lease Period
              </p>
              <p className="font-medium flex items-center gap-2">
                <IconCalendarEvent
                  size={14}
                  className="text-muted-foreground"
                />
                {formatDateRange(lease.lease_start_date, lease.lease_end_date)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Created At
              </p>
              <p className="font-medium">{lease.created_at || "—"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Updated At
              </p>
              <p className="font-medium">{lease.updated_at || "—"}</p>
            </div>
          </CardContent>
        </Card>

        {/* --- TABS: PEOPLE / DOCUMENTS / NOTES --- */}
        <Card className="shadow-sm border-muted/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">
              Lease Breakdown
            </CardTitle>
            <CardDescription>
              Parties involved, supporting documents, and additional notes.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0">
            <Tabs defaultValue="people" className="w-full">
              <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
                <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex bg-muted/50">
                  <TabsTrigger
                    value="people"
                    className="flex items-center gap-2"
                  >
                    <IconUser size={14} />
                    <span>People</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="documents"
                    className="flex items-center gap-2"
                  >
                    <IconFileText size={14} />
                    <span>Documents</span>
                    <span className="inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full bg-background text-xs font-semibold border">
                      {documentsCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="notes"
                    className="flex items-center gap-2"
                  >
                    <IconNotes size={14} />
                    <span>Notes</span>
                  </TabsTrigger>
                </TabsList>

                <div className="text-xs text-muted-foreground">
                  Click on any file to preview it.
                </div>
              </div>

              {/* PEOPLE TAB */}
              <TabsContent value="people" className="mt-4 space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  {/* Tenant card */}
                  <Card className="border-muted/60 shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <IconUser size={16} />
                        Tenant
                      </CardTitle>
                      <CardDescription>Primary lease holder</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Name
                        </p>
                        <p className="font-medium">{tenant?.full_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Phone
                        </p>
                        <p className="font-medium">{tenant?.phone || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Email
                        </p>
                        <p className="font-medium">{tenant?.email || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Address
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {[
                            tenant?.city,
                            tenant?.sub_city,
                            tenant?.woreda,
                            tenant?.house_number,
                          ]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Representative card */}
                  {lease.agreement_type === "representative" && (
                    <Card className="border-muted/60 shadow-none">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <IconId size={16} />
                          Representative
                        </CardTitle>
                        <CardDescription>
                          Optional authorized delegate
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Name
                          </p>
                          <p className="font-medium">
                            {representative?.full_name}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Phone
                          </p>
                          <p className="font-medium">
                            {representative?.phone || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Email
                          </p>
                          <p className="font-medium">
                            {representative?.email || "—"}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            Document
                          </p>
                          {lease.representative_document?.url ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="inline-flex items-center gap-1 text-xs"
                              onClick={() =>
                                handleOpenPreview({
                                  title:
                                    lease.representative_document?.file_name ||
                                    "Representative document",
                                  url: lease.representative_document
                                    ?.url as string,
                                })
                              }
                            >
                              <IconEye size={14} />
                              <span>View document</span>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Current owner card */}
                  <Card className="border-muted/60 shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <IconHome size={16} />
                        Current Owner
                      </CardTitle>
                      <CardDescription>Active ownership record</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Name
                        </p>
                        <p className="font-medium">
                          {currentOwner?.owner?.full_name || "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Ownership Period
                        </p>
                        <p className="font-medium">
                          {formatDateRange(
                            currentOwner?.start_date,
                            currentOwner?.end_date
                          )}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Status
                        </p>
                        <p className="font-medium">
                          {humanize(currentOwner?.status)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Document
                        </p>
                        {currentOwner?.ownership_document?.url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="inline-flex items-center gap-1 text-xs"
                            onClick={() =>
                              handleOpenPreview({
                                title:
                                  currentOwner?.ownership_document?.file_name ||
                                  "Ownership document",
                                url: currentOwner?.ownership_document
                                  ?.url as string,
                              })
                            }
                          >
                            <IconEye size={14} />
                            <span>View document</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Witnesses */}
                <Card className="border-muted/60 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Witnesses</CardTitle>
                    <CardDescription>
                      Names recorded on the lease agreement.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {witnesses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No witnesses recorded.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {witnesses.map((w, i) => (
                          <div
                            key={`${w}-${i}`}
                            className="rounded-lg border bg-muted/10 px-3 py-2"
                          >
                            <p className="text-xs text-muted-foreground">
                              Witness {i + 1}
                            </p>
                            <p className="text-sm font-medium">{w}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* DOCUMENTS TAB */}
              <TabsContent value="documents" className="mt-4">
                {documentsCount === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No documents were attached to this lease.
                  </p>
                ) : (
                  <div className="rounded-lg border bg-muted/10 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/60">
                      <p className="text-sm font-medium">
                        Documents
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({documentsCount} available)
                        </span>
                      </p>
                    </div>

                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow>
                          <TableHead className="w-[35%]">Type</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="w-[15%] text-center">
                            Preview
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {docs.map((d, i) => {
                          const url = d.file?.url || null;
                          const name = d.file?.file_name;

                          return (
                            <TableRow
                              key={`${d.label}-${i}`}
                              className="hover:bg-muted/40"
                            >
                              <TableCell className="font-medium">
                                {d.label}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {name || "—"}
                              </TableCell>
                              <TableCell className="text-center">
                                {url ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="inline-flex items-center gap-1 text-xs"
                                    onClick={() =>
                                      handleOpenPreview({
                                        title: name as string,
                                        url: url,
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
                )}
              </TabsContent>

              {/* NOTES TAB */}
              <TabsContent value="notes" className="mt-4 space-y-4">
                <Card className="border-muted/60 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Notes</CardTitle>
                    <CardDescription>
                      Additional information attached to this lease record.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {lease.notes ? (
                      <div className="rounded-lg border bg-muted/10 p-4">
                        <p className="text-sm whitespace-pre-wrap">
                          {lease.notes}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No notes added.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-muted/60 shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Audit</CardTitle>
                      <CardDescription>Record lifecycle info</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Created By
                        </p>
                        <p className="font-medium">
                          {lease.created_by?.full_name ?? "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Updated By
                        </p>
                        <p className="font-medium">
                          {lease.updated_by?.full_name ?? "—"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Created At
                        </p>
                        <p className="font-medium">{lease.created_at || "—"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Updated At
                        </p>
                        <p className="font-medium">{lease.updated_at || "—"}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-muted/60 shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Quick Links</CardTitle>
                      <CardDescription>Helpful navigation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        asChild
                      >
                        <Link
                          to="/admin/units/$unitId"
                          params={{ unitId: unitId as string }}
                        >
                          <IconHome size={16} className="mr-2" />
                          View Unit Details
                        </Link>
                      </Button>
                      {unit?.building?.id && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          asChild
                        >
                          <Link
                            to="/admin/buildings/$buildingId"
                            params={{ buildingId: String(unit.building.id) }}
                          >
                            <IconHome size={16} className="mr-2" />
                            View Building
                          </Link>
                        </Button>
                      )}
                      {lease.lease_document?.url && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() =>
                            handleOpenPreview({
                              title:
                                lease.lease_document?.file_name ||
                                "Lease document",
                              url: lease.lease_document?.url as string,
                            })
                          }
                        >
                          <IconFileText size={16} className="mr-2" />
                          Open Lease Document
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
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
                  Cannot preview this file type.{" "}
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
    </>
  );
}
