import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StepTenantTypeProps {
  tenantType: "existing" | "new" | null;
  agreementType: "owner" | "representative" | null;
  setTenantType: (value: "existing" | "new") => void;
  setAgreementType: (value: "owner" | "representative") => void;
  completeStep: () => void;
}

export default function StepType({
  tenantType,
  agreementType,
  setTenantType,
  setAgreementType
}: StepTenantTypeProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Lease</CardTitle>
        <CardDescription>Select the tenant type and how the agreement will be created.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* TENANT TYPE */}
        <div className="space-y-2">
          <p className="font-medium">Tenant Type</p>
          <div className="flex gap-4">
            <Button
              variant={tenantType === "existing" ? "default" : "outline"}
              onClick={() => setTenantType("existing")}
            >
              Existing Tenant
            </Button>

            <Button
              variant={tenantType === "new" ? "default" : "outline"}
              onClick={() => setTenantType("new")}
            >
              New Tenant
            </Button>
          </div>
        </div>

        {/* AGREEMENT CREATION TYPE */}
        <div className="space-y-2">
          <p className="font-medium">Agreement Created By</p>
          <div className="flex gap-4">
            <Button
              variant={agreementType === "owner" ? "default" : "outline"}
              onClick={() => setAgreementType("owner")}
            >
              Owner
            </Button>

            <Button
              variant={agreementType === "representative" ? "default" : "outline"}
              onClick={() => setAgreementType("representative")}
            >
              Representative
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
