import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { StickerPrintData } from "@/types/types";
import type { ApiError } from "@/types/api-error";
import { IconLoader2, IconPrinter } from "@tabler/icons-react";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";
import { fetchStickerPrintData } from "../lib/vehicles";
import { PrintableSticker } from "./printable-sticker";

type StickerPrintPreviewProps = {
  stickerIssueId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function StickerPrintPreview({
  stickerIssueId,
  open,
  onOpenChange,
}: StickerPrintPreviewProps) {
  const [data, setData] = useState<StickerPrintData | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: data ? `Sticker-${data.sticker_code}` : "Parking-sticker",
  });

  useEffect(() => {
    if (!open || !stickerIssueId) {
      setData(null);
      setQrUrl(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setData(null);
    setQrUrl(null);
    fetchStickerPrintData(stickerIssueId)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err: ApiError) => {
        const msg =
          typeof err.data === "object" &&
          err.data !== null &&
          "message" in err.data &&
          typeof (err.data as { message?: string }).message === "string"
            ? (err.data as { message: string }).message
            : "Failed to load sticker print data.";
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, stickerIssueId]);

  useEffect(() => {
    const token = data?.lookup_token;
    if (!token) {
      setQrUrl(null);
      return;
    }
    QRCode.toDataURL(token, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then(setQrUrl)
      .catch(() => setQrUrl(null));
  }, [data?.lookup_token]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Print parking sticker</DialogTitle>
          <DialogDescription>
            QR carries the lookup token. The line under the QR uses the parking scramble
            rule (see doc/sticker_print.md): plate and unit positions are swapped so the
            raw unit number is not obvious to passers-by.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center py-8">
            <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="flex justify-center">
            <PrintableSticker ref={printRef} data={data} qrDataUrl={qrUrl} />
          </div>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handlePrint} disabled={!data}>
            <IconPrinter className="h-4 w-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
