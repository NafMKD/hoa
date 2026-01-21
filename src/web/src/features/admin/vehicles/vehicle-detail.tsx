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
import { fetchVehicleDetail, deleteVehicle } from "./lib/vehicles";
import type { Vehicle } from "@/types/types";
import { Link, useParams } from "@tanstack/react-router";
import {
  IconArrowLeft,
  IconArrowLeftCircle,
  IconLoader2,
  IconTrash,
  IconFileText,
  IconCar,
  IconBuilding,
} from "@tabler/icons-react";
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

export function VehicleDetail() {
  const { vehicleId } = useParams({
    from: "/_authenticated/admin/vehicles/$vehicleId",
  });

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        const data = await fetchVehicleDetail(vehicleId as string);
        setVehicle(data);
      } finally {
        setIsLoading(false);
      }
    };
    loadVehicle();
  }, [vehicleId]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const triggerConfirm = () => setConfirmOpen(true);

  const onConfirmDelete = async () => {
    if (!vehicle) return;
    setIsProcessing(true);
    try {
      await deleteVehicle(vehicle.id);
      toast.success("Vehicle deleted successfully");
      // Redirect back after delete
      window.history.back();
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

  if (!vehicle) {
    return (
      <Main>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
          <p className="text-muted-foreground">Vehicle not found.</p>
          <Button asChild>
            <Link to="/admin/vehicles">
              <IconArrowLeftCircle size={16} className="mr-1" />
              Back to Vehicles
            </Link>
          </Button>
        </div>
      </Main>
    );
  }

  const title = `${vehicle.make} ${vehicle.model}`;
  const unitName = vehicle.unit?.name ?? `N/A`;
  const unit = vehicle.unit ?? null;

  // If your DocumentResource provides a URL field, use it; otherwise fallback
  const documentUrl =
    (vehicle as Vehicle)?.document?.url ||
    null;

  return (
    <Main className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Vehicle Details</h1>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            variant="destructive"
            disabled={isProcessing}
            onClick={triggerConfirm}
          >
            {isProcessing ? (
              <IconLoader2 className="animate-spin h-4 w-4" />
            ) : (
              <IconTrash size={16} className="mr-1" />
            )}
            Delete
          </Button>

          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this Vehicle?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will soft-delete the vehicle. This action can be reversed
                  only if your system supports restoring deleted records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirmDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>

          <Button variant="outline" asChild>
            <Link to="/admin/vehicles">
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
                <CardTitle className="text-xl font-semibold leading-tight flex items-center gap-2">
                  <IconCar className="h-5 w-5 text-muted-foreground" />
                  {title}
                </CardTitle>
              </div>

              <CardDescription className="text-sm text-muted-foreground">
                Vehicle overview and registration details.
              </CardDescription>

              <div className="mt-2 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Unit
                  </p>
                  <p className="text-sm font-medium break-all flex items-center gap-2">
                    <IconBuilding className="h-4 w-4 text-muted-foreground" />
                    { !unit ? unitName : (
                        <Link to={`/admin/units/$unitId`} params={{ unitId: unit.id.toString() }} target="_blank" className="text-sm underline">
                            {unitName}
                        </Link>
                    )}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    License Plate
                  </p>
                  <p className="text-sm font-medium break-all">
                    {vehicle.license_plate}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Year
                  </p>
                  <p className="text-sm font-medium break-all">{vehicle.year}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Color
                  </p>
                  <p className="text-sm font-medium break-all">
                    {vehicle.color || "—"}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Created At
                  </p>
                  <p className="text-sm font-medium break-all">
                    {formatDate(vehicle.created_at)}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Last Updated
                  </p>
                  <p className="text-sm font-medium break-all">
                    {formatDate(vehicle.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Side box - Document */}
            <div className="grid w-full max-w-xs grid-cols-1 gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Vehicle Document
                </p>

                {documentUrl ? (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium underline"
                  >
                    <IconFileText className="h-4 w-4" />
                    View Document
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="flex flex-wrap gap-2 w-full">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="document">Document</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-6 space-y-8">
          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <IconCar className="h-4 w-4 text-muted-foreground" />
                  Vehicle Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Make</span>
                  <span className="font-medium">{vehicle.make}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{vehicle.model}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Year</span>
                  <span className="font-medium">{vehicle.year}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">Color</span>
                  <span className="font-medium">{vehicle.color || "—"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <IconBuilding className="h-4 w-4 text-muted-foreground" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Unit</span>
                  <span className="font-medium">{unitName}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">License Plate</span>
                  <span className="font-medium">{vehicle.license_plate}</span>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="document" className="mt-6">
          {documentUrl ? (
            <Card className="border-muted shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 underline"
                >
                  <IconFileText className="h-4 w-4" />
                  Open Vehicle Document
                </a>

                {/* Optional: PDF embed if it's a pdf url */}
                {String(documentUrl).toLowerCase().includes(".pdf") && (
                  <div className="mt-4 rounded-md border overflow-hidden">
                    <iframe
                      title="Vehicle Document"
                      src={documentUrl}
                      className="w-full h-[70vh]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">
              No document available.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </Main>
  );
}
