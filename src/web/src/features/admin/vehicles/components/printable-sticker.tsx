import type { StickerPrintData } from "@/types/types";
import { forwardRef } from "react";

type PrintableStickerProps = {
  data: StickerPrintData;
  qrDataUrl: string | null;
};

export const PrintableSticker = forwardRef<HTMLDivElement, PrintableStickerProps>(
  ({ data, qrDataUrl }, ref) => {
    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 rounded-lg border border-gray-200 print:border-0 print:rounded-none max-w-[90mm] mx-auto font-sans"
      >
        <div className="text-center border-b border-gray-300 pb-4 mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Parking permit
          </p>
          <p className="text-lg font-bold mt-1">{data.sticker_code}</p>
        </div>
        <div className="flex justify-center mb-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="" className="w-[220px] h-[220px]" />
          ) : (
            <p className="text-sm text-gray-500">QR unavailable</p>
          )}
        </div>
        <p className="text-center text-sm font-mono leading-relaxed break-words">
          {data.sticker_line}
        </p>
      </div>
    );
  }
);

PrintableSticker.displayName = "PrintableSticker";
