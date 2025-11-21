import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import StepTenantType from "./components/leases/steps/step_tenant_type";
import StepTenantDetails from "./components/leases/steps/step_tenant_details";
import StepRepresentative from "./components/leases/steps/step_representative";
import StepLeaseForm from "./components/leases/steps/step_lease_form";
import StepReview from "./components/leases/steps/step_review";
import StepPdfPreview from "./components/leases/steps/step_pdf_preview";

export function Leases() {
  const [step, setStep] = useState("step_1");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // form state
  const [tenantType, setTenantType] = useState<"existing" | "new" | null>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [tenantData, setTenantData] = useState<any>({});
  const [representativeData, setRepresentativeData] = useState<any>(null);
  const [leaseData, setLeaseData] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const completeStep = (currentStep: string) => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    // auto-advance logic
    switch (currentStep) {
      case "step_1":
        setStep("step_2");
        break;
      case "step_2":
        if (tenantType === "existing") {
          setStep("step_4"); // skip representative if not needed
        } else {
          setStep("step_3");
        }
        break;
      case "step_3":
        setStep("step_4");
        break;
      case "step_4":
        setStep("step_5");
        break;
      case "step_5":
        setStep("step_6");
        break;
      default:
        break;
    }
  };

  return (
    <>
      <Header fixed>
        <div className="ml-auto flex items-center space-x-4">
          <Button asChild>
            <Link to="/admin/units">
              <IconArrowLeft size={16} className="mr-1" />
              Back to Units
            </Link>
          </Button>
        </div>
      </Header>

      <Main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Add New Lease</h1>

        <Card className="shadow-sm border-muted">
          <CardHeader>
            <CardTitle>Lease Creation</CardTitle>
            <CardDescription>Follow the steps to create a new lease</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={step}>
              <TabsList className="grid grid-cols-6 w-full mb-6">
                <TabsTrigger value="step_1">Tenant Type</TabsTrigger>
                <TabsTrigger value="step_2" disabled={!completedSteps.includes("step_1")}>Tenant Details</TabsTrigger>
                <TabsTrigger value="step_3" disabled={!completedSteps.includes("step_2")}>Representative</TabsTrigger>
                <TabsTrigger value="step_4" disabled={!completedSteps.includes("step_2") && !completedSteps.includes("step_3")}>Lease Form</TabsTrigger>
                <TabsTrigger value="step_5" disabled={!completedSteps.includes("step_4")}>Review</TabsTrigger>
                <TabsTrigger value="step_6" disabled={!completedSteps.includes("step_5")}>PDF Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="step_1">
                <StepTenantType
                  tenantType={tenantType}
                  setTenantType={setTenantType}
                  completeStep={() => completeStep("step_1")}
                />
              </TabsContent>

              <TabsContent value="step_2">
                <StepTenantDetails
                  tenantType={tenantType}
                  tenantId={tenantId}
                  setTenantId={setTenantId}
                  tenantData={tenantData}
                  setTenantData={setTenantData}
                  completeStep={() => completeStep("step_2")}
                />
              </TabsContent>

              <TabsContent value="step_3">
                <StepRepresentative
                  representativeData={representativeData}
                  setRepresentativeData={setRepresentativeData}
                  completeStep={() => completeStep("step_3")}
                />
              </TabsContent>

              <TabsContent value="step_4">
                <StepLeaseForm
                  leaseData={leaseData}
                  setLeaseData={setLeaseData}
                  completeStep={() => completeStep("step_4")}
                />
              </TabsContent>

              <TabsContent value="step_5">
                <StepReview
                  tenantType={tenantType}
                  tenantData={tenantData}
                  tenantId={tenantId}
                  representativeData={representativeData}
                  leaseData={leaseData}
                  completeStep={() => completeStep("step_5")}
                  setPdfUrl={setPdfUrl}
                />
              </TabsContent>

              <TabsContent value="step_6">
                <StepPdfPreview pdfUrl={pdfUrl} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
