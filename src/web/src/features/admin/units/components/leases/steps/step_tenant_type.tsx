import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StepTenantTypeProps {
  tenantType: "existing" | "new" | null;
  setTenantType: (value: "existing" | "new") => void;
  completeStep: () => void;
}

export default function StepTenantType({ tenantType, setTenantType, completeStep }: StepTenantTypeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Tenant Type</CardTitle>
        <CardDescription>Choose whether the tenant has an existing account or needs a new one.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <Button
          className="mt-4"
          onClick={completeStep}
          disabled={!tenantType}
        >
          Next
        </Button>
      </CardContent>
    </Card>
  );
}
