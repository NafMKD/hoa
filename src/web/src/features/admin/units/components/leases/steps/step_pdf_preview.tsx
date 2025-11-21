interface StepPdfPreviewProps {
    pdfUrl: string | null;
  }
  
  export default function StepPdfPreview({ pdfUrl }: StepPdfPreviewProps) {
    if (!pdfUrl) return <p>No PDF available.</p>;
    return (
      <iframe
        src={pdfUrl}
        className="w-full h-[600px] border rounded"
        title="Lease PDF"
      />
    );
  }
  