import TenantForm from "../forms/tenant_form";

interface StepTenantDetailsProps {
  tenantType: "existing" | "new" | null;
  tenantId: number | null;
  setTenantId: (id: number) => void;
  tenantData: any;
  setTenantData: (data: any) => void;
  completeStep: () => void;
}

export default function StepTenantDetails({ tenantType, tenantId, setTenantId, tenantData, setTenantData, completeStep }: StepTenantDetailsProps) {
  return (
    <div className="space-y-4">
      <TenantForm
        tenantType={tenantType}
        tenantId={tenantId}
        setTenantId={setTenantId}
        tenantData={tenantData}
        setTenantData={setTenantData}
      />
      <div>
        <button
          className="btn btn-primary"
          onClick={completeStep}
        >
          Next
        </button>
      </div>
    </div>
  );
}
