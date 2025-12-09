import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { importUnits } from "../lib/units";
import {
  IconUpload,
  IconDownload,
  IconAlertTriangle,
  IconHome,
} from "@tabler/icons-react";

type FailedItem =
  | { name?: string; unit_name?: string; phone?: string; reason?: string }
  | string;

function normalizeFailed(failed: any): Array<{ label: string; reason?: string }> {
  if (!failed) return [];

  if (Array.isArray(failed)) {
    return failed.map((item: FailedItem) => {
      if (typeof item === "string") return { label: item };

      const label =
        item.unit_name ||
        item.name ||
        item.phone ||
        "Unknown row";

      return { label, reason: item.reason };
    });
  }

  // If API returns { "Unit 101": "reason", "+2519xxxx": "reason" }
  if (typeof failed === "object") {
    return Object.entries(failed).map(([key, reason]) => ({
      label: key,
      reason: typeof reason === "string" ? reason : undefined,
    }));
  }

  return [];
}

export function ImportUnitsDialog({
  onSuccess,
  templateUrl = "/templates/units-import-template.xlsx",
}: {
  onSuccess: () => void;
  templateUrl?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [failedItems, setFailedItems] = React.useState<
    Array<{ label: string; reason?: string }>
  >([]);

  const resetState = () => {
    setFile(null);
    setIsUploading(false);
    setFailedItems([]);
  };

  const handleClose = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) resetState();
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file first.");
      return;
    }

    setIsUploading(true);
    setFailedItems([]);

    try {
      const res = await importUnits(file);
      const failed = normalizeFailed(res?.failed);

      if (failed.length > 0) {
        setFailedItems(failed);
        toast.warning(`Import completed with ${failed.length} skipped item(s).`);
      } else {
        toast.success(res?.message ?? "Units imported successfully.");
        setOpen(false);
      }

      onSuccess();
    } catch (err: any) {
      const failed = normalizeFailed(err?.failed);
      if (failed.length > 0) setFailedItems(failed);

      toast.error(err?.message ?? "Import failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <IconUpload className="h-4 w-4" />
          Import Units
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconHome className="h-5 w-5" />
            Import Units
          </DialogTitle>
          <DialogDescription>
            Upload an XLSX or CSV to bulk add/update units.
            <span className="block mt-1">
              This template also supports optional <b>owners</b> and <b>leases</b> via phone-based matching.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium">Use the official template</p>
                <p className="text-xs text-muted-foreground">
                  Ensures required unit fields and relationship columns are correct.
                </p>
              </div>

              <Button asChild variant="outline" className="gap-2">
                <a href={templateUrl} download>
                  <IconDownload className="h-4 w-4" />
                  Download Template
                </a>
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium">Upload file</label>

            <div className="rounded-xl border border-dashed p-4 transition hover:bg-muted/30">
              <Input
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Supported formats: .xlsx, .csv
              </p>
            </div>

            {file && (
              <div className="flex items-center justify-between rounded-lg border bg-background p-2">
                <div className="truncate text-sm">
                  <span className="font-medium">Selected:</span>{" "}
                  <span className="text-muted-foreground">{file.name}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setFile(null)}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {failedItems.length > 0 && (
            <div className="rounded-xl border border-amber-200/40 bg-amber-50/10 p-4">
              <div className="mb-2 flex items-center gap-2">
                <IconAlertTriangle className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-semibold">
                  Some rows were not imported
                </p>
              </div>

              <p className="text-xs text-muted-foreground mb-3">
                This list may include unit names or phone numbers that couldn’t be matched
                or failed validation.
              </p>

              <div className="max-h-40 overflow-auto rounded-lg border bg-background">
                <ul className="divide-y">
                  {failedItems.map((f, idx) => (
                    <li key={`${f.label}-${idx}`} className="px-3 py-2 text-sm">
                      <span className="font-medium">{f.label}</span>
                      {f.reason && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          — {f.reason}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button
            onClick={handleImport}
            disabled={isUploading || !file}
            className="gap-2"
          >
            <IconUpload className="h-4 w-4" />
            {isUploading ? "Importing..." : "Start Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
