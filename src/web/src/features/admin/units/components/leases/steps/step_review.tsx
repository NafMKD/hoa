interface StepReviewProps {
    tenantType: "existing" | "new" | null;
    tenantData: any;
    tenantId: number | null;
    representativeData: any;
    leaseData: any;
    completeStep: () => void;
    setPdfUrl: (url: string) => void;
  }
  
  export default function StepReview({ tenantType, tenantData, tenantId, representativeData, leaseData, completeStep, setPdfUrl }: StepReviewProps) {
    const handleSubmit = async () => {
      const formData = new FormData();
  
      if (tenantType === "new") {
        Object.entries(tenantData).forEach(([key, value]) => formData.append(key, value as string | Blob));
      } else {
        formData.append("tenant_id", tenantId as any);
      }
  
      if (representativeData) {
        Object.entries(representativeData).forEach(([key, value]) => formData.append(key, value as string | Blob));
      }
  
      Object.entries(leaseData).forEach(([key, value]) => formData.append(key, value as string));
  
      const res = await fetch("/api/leases", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setPdfUrl(data.pdf_url);
      completeStep();
    };
  
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Review Details</h3>
        <pre className="bg-gray-50 p-2 rounded">{JSON.stringify({ tenantData, representativeData, leaseData }, null, 2)}</pre>
        <button className="btn btn-primary" onClick={handleSubmit}>
          Submit & Generate PDF
        </button>
      </div>
    );
  }
  