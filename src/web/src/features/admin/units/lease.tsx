import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IconArrowLeft } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import StepType from "./components/leases/steps/step_type";


export function Leases() {
  const [step, setStep] = useState("step_1");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);


  // const completeStep = (currentStep: string) => {
  //   if (!completedSteps.includes(currentStep)) {
  //     setCompletedSteps([...completedSteps, currentStep]);
  //   }
  //   // auto-advance logic
  //   switch (currentStep) {
  //     case "step_1":
  //       setStep("step_2");
  //       break;
  //     case "step_2":
  //       // if ("existing" === "existing") {
  //         setStep("step_4"); // skip representative if not needed
  //       // } else {
  //       //   setStep("step_3");
  //       // }
  //       break;
  //     case "step_3":
  //       setStep("step_4");
  //       break;
  //     case "step_4":
  //       setStep("step_5");
  //       break;
  //     case "step_5":
  //       setStep("step_6");
  //       break;
  //     default:
  //       break;
  //   }
  // };

  return (
    <>
      <Header fixed>
              <div className="ml-auto flex items-center space-x-4">
                <Search />
                <ThemeSwitch />
                <ProfileDropdown />
              </div>
            </Header>

      <Main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold tracking-tight">Add New Lease</h1>
          <Button variant="outline" asChild>
            <Link to="/admin/units">
              <IconArrowLeft size={16} className="mr-1" />
              Back
            </Link>
          </Button>
        </div>

        <Card className="shadow-sm border-muted">
          <CardHeader>
            <CardTitle>Lease Creation</CardTitle>
            <CardDescription>Follow the steps to create a new lease</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={step}>
              <TabsList className="grid grid-cols-6 w-full mb-6">
                <TabsTrigger value="step_1">Type</TabsTrigger>
                <TabsTrigger value="step_2" disabled={!completedSteps.includes("step_1")}>Tenant Details</TabsTrigger>
                <TabsTrigger value="step_3" disabled={!completedSteps.includes("step_2")}>Representative</TabsTrigger>
                <TabsTrigger value="step_4" disabled={!completedSteps.includes("step_2") && !completedSteps.includes("step_3")}>Lease Form</TabsTrigger>
              </TabsList>

              <TabsContent value="step_1">
                <StepType
                  tenantType={"existing"}
                  agreementType={"owner"}
                  setTenantType={(value) => {
                    console.log("Set Tenant Type:", value);
                  }}
                  setAgreementType={(value) => {
                    console.log("Set Agreement Type:", value);
                  }}
                  completeStep={() => {
                    if (!completedSteps.includes("step_1")) {
                      setCompletedSteps([...completedSteps, "step_1"]);
                    }
                    setStep("step_2");
                  }}
                />
              </TabsContent>

              <TabsContent value="step_2">
                step 2 content
              </TabsContent>

              <TabsContent value="step_3">
                step 3 content
              </TabsContent>

              <TabsContent value="step_4">
                step 4 content
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                disabled={step === "step_1"}
                onClick={() => {
                  switch (step) {
                    case "step_2":
                      setStep("step_1");
                      break;
                    case "step_3":
                      setStep("step_2");
                      break;
                    case "step_4":
                      if (completedSteps.includes("step_3")) {
                        setStep("step_3");
                      } else {
                        setStep("step_2");
                      }
                      break;
                    default:
                      break;
                  }
                }}
              >
                Back
              </Button>
              <Button
                disabled={
                  (step === "step_1" && !completedSteps.includes("step_1")) ||
                  (step === "step_2" && !completedSteps.includes("step_2")) ||
                  (step === "step_3" && !completedSteps.includes("step_3"))
                }
                onClick={() => {
                  switch (step) {
                    case "step_1":
                      setStep("step_2");
                      break;
                    case "step_2":
                      if ("existing" === "existing") {
                        setStep("step_4"); // skip representative if not needed
                      } else {
                        setStep("step_3");
                      }
                      break;
                    case "step_3":
                      setStep("step_4");
                      break;
                    default:
                      break;
                  }
                }}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        </Card>
      </Main>
    </>
  );
}
