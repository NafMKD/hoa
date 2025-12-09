import { useCallback, useMemo, useState } from "react";
import { Header } from "@/components/layout/header";
import { Main } from "@/components/layout/main";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconArrowLeft,
  IconCircleCheck,
} from "@tabler/icons-react";
import { submitLeaseAgreement } from "./lib/lease";
import {
  type StepKey,
  type StepTypeValues,
  type StepTenantExistingValues,
  type StepTenantNewValues,
  type StepRepresentativeValues,
  type StepLeaseValues,
  STEP_ORDER,
  type StepRepresentativeExistingValues,
} from "./components/leases/types";

// Import Step Components
import { StepType } from "./components/leases/steps/step-type";
import { StepTenant } from "./components/leases/steps/step-tenant";
import { StepRepresentative } from "./components/leases/steps/step-representative";
import { StepLease } from "./components/leases/steps/step-lease";
import { Search } from "@/components/search";
import { ThemeSwitch } from "@/components/theme-switch";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { ReviewStep } from "./components/leases/steps/step-review";
import { Link, useParams } from "@tanstack/react-router";
import { toast } from "sonner";

/**
 * -------------------------
 * Main Component
 * -------------------------
 */
export function Leases() {
  const { unitId } = useParams({
    from: "/_authenticated/admin/units/$unitId/leases",
  });
  const [activeStep, setActiveStep] = useState<StepKey>("type");
  const [completed, setCompleted] = useState<Record<StepKey, boolean>>({
    type: false,
    tenant: false,
    representative: false,
    lease: false,
    review: false
  });

  // Values collected from each step
  const [typeValues, setTypeValues] = useState<StepTypeValues | null>(null);
  const [tenantExistingValues, setTenantExistingValues] =
    useState<StepTenantExistingValues | null>(null);
  const [tenantNewValues, setTenantNewValues] =
    useState<StepTenantNewValues | null>(null);
  const [representativeValues, setRepresentativeValues] =
    useState<StepRepresentativeValues | null>(null);
  const [representativeExistingValues, setRepresentativeExistingValues] =
    useState<StepRepresentativeExistingValues | null>(null);
  const [leaseValues, setLeaseValues] = useState<StepLeaseValues | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Helper to determine if representative step is required
  const representativeRequired = useMemo(() => {
    return typeValues?.leasingBy === "representative";
  }, [typeValues]);

  // Mark step completed
  const markCompleted = useCallback((step: StepKey, ok = true) => {
    setCompleted((prev) => ({ ...prev, [step]: ok }));
  }, []);

  // Navigation handlers
  const goNext = useCallback(() => {
    const idx = STEP_ORDER.indexOf(activeStep);
    let nextIdx = idx + 1;

    // Skip representative if not required
    if (STEP_ORDER[nextIdx] === "representative" && !representativeRequired) {
      nextIdx++;
    }
    if (nextIdx < STEP_ORDER.length) {
      setActiveStep(STEP_ORDER[nextIdx]);
    }
  }, [activeStep, representativeRequired]);

  const goPrev = useCallback(() => {
    const idx = STEP_ORDER.indexOf(activeStep);
    let prevIdx = idx - 1;
    // Skip back further if previous is representative and not required
    if (STEP_ORDER[prevIdx] === "representative" && !representativeRequired) {
      prevIdx--;
    }
    if (prevIdx >= 0) {
      setActiveStep(STEP_ORDER[prevIdx]);
    }
  }, [activeStep, representativeRequired]);

  // Reset function passed to StepType
  const resetDependentState = useCallback(() => {
    setCompleted((prev) => ({
      ...prev,
      tenant: false,
      representative: false,
      lease: false,
    }));
    setTenantExistingValues(null);
    setTenantNewValues(null);
    setRepresentativeValues(null);
    setRepresentativeExistingValues(null);
    setLeaseValues(null);
  }, []);

  // Attempt to change step (prevent forward jump if previous steps incomplete)
  function tryChangeStep(next: StepKey) {
    const nextIndex = STEP_ORDER.indexOf(next);
    const allPrevComplete = STEP_ORDER.slice(0, nextIndex).every((k) => {
      if (k === "representative" && !representativeRequired) {
        return true;
      }
      return completed[k];
    });

    if (allPrevComplete) {
      setActiveStep(next);
    } else {
      console.warn("Cannot jump forward - previous steps incomplete");
    }
  }

  // Final submit: combine validated values and send to backend
  async function handleFinalSubmit() {
    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      // Logic from the original component to construct FormData
      if (!typeValues || !leaseValues) {
        throw new Error("Missing data");
      }

      const fd = new FormData();
      fd.append("leasing_by", typeValues.leasingBy);
      fd.append("renter_type", typeValues.renterType);
      if (typeValues.leasingBy === "representative" && typeValues.representativeType) {
        fd.append("representative_type", typeValues.representativeType);
      } 

      // tenant
      if (typeValues.renterType === "existing") {
        if (!tenantExistingValues) throw new Error("Tenant selection missing");
        fd.append("tenant_id", tenantExistingValues.tenant_id.toString());
      } else {
        if (!tenantNewValues) throw new Error("New tenant info missing");
        fd.append("tenant_first_name", tenantNewValues.first_name);
        fd.append("tenant_last_name", tenantNewValues.last_name);
        fd.append("tenant_phone", tenantNewValues.phone);
        if (tenantNewValues.email) fd.append("tenant_email", tenantNewValues.email);
        fd.append("tenant_role", "tenant");
        if (tenantNewValues.id_file && tenantNewValues.id_file instanceof File) {
          fd.append("tenant_id_file", tenantNewValues.id_file as Blob);
        }
      }

      // representative
      if (typeValues.leasingBy === "representative") {
        if (typeValues.representativeType === "existing") {
          if (!representativeExistingValues) throw new Error("Representative selection missing");
          fd.append('representative_id', representativeExistingValues.representative_id.toString());
        } else {
          if (!representativeValues)
            throw new Error("Representative info missing");
          fd.append(
            "representative_first_name",
            representativeValues.first_name
          );
          fd.append("representative_last_name", representativeValues.last_name);
          fd.append("representative_phone", representativeValues.phone);
          if (representativeValues.email)
            fd.append("representative_email", representativeValues.email);
          fd.append("representative_role", "representative");
          if (
            representativeValues.id_file &&
            representativeValues.id_file instanceof File
          ) {
            fd.append(
              "representative_id_file",
              representativeValues.id_file as Blob
            );
          }
        }
      }   

      // Lease fields
      fd.append("agreement_amount", String(leaseValues.agreement_amount));
      if (leaseValues.lease_template_id)
        fd.append("lease_template_id", leaseValues.lease_template_id);
      fd.append("lease_start_date", leaseValues.lease_start_date);
      if (leaseValues.lease_end_date)
        fd.append("lease_end_date", leaseValues.lease_end_date);
      if (
        leaseValues.representative_document &&
        leaseValues.representative_document instanceof File
      ) {
        fd.append(
          "representative_document",
          leaseValues.representative_document as Blob
        );
      }
      if (leaseValues.witness_1_full_name)
        fd.append("witness_1_full_name", leaseValues.witness_1_full_name);
      if (leaseValues.witness_2_full_name)
        fd.append("witness_2_full_name", leaseValues.witness_2_full_name);

      if (leaseValues.notes) fd.append("notes", leaseValues.notes);

      console.log("Submitting lease with data:", Array.from(fd.entries()));
      
      // Submit to API
      await submitLeaseAgreement(unitId,fd);

    } catch (err: any) {
      toast.error("Failed to submit lease. Please try again.");
      setSubmissionError(err?.message || "Unable to submit lease");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Determine which step component to render
  const renderStep = () => {
    switch (activeStep) {
      case "type":
        return (
          <StepType
            initialValues={typeValues}
            setTypeValues={setTypeValues}
            markCompleted={markCompleted}
            resetDependentState={resetDependentState}
            goNext={goNext}
          />
        );
      case "tenant":
        return (
          <StepTenant
            typeValues={typeValues}
            setTenantExistingValues={setTenantExistingValues}
            setTenantNewValues={setTenantNewValues}
            tenantExistingValues={tenantExistingValues}
            tenantNewValues={tenantNewValues}
            unitId={unitId}
            markCompleted={markCompleted}
            goNext={goNext}
            goPrev={goPrev}
          />
        );
      case "representative":
        return representativeRequired ? (
          <StepRepresentative
            typeValues={typeValues}
            setRepresentativeValues={setRepresentativeValues}
            setRepresentativeExistingValues={setRepresentativeExistingValues}
            representativeValues={representativeValues}
            tenantExistingValues={tenantExistingValues}
            unitId={unitId}
            markCompleted={markCompleted}
            goNext={goNext}
            goPrev={goPrev}
          />
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            Representative step is **skipped** as the lease is by **Owner**.
          </div>
        );
      case "lease":
        return (
          <StepLease
            typeValues={typeValues}
            setLeaseValues={setLeaseValues}
            leaseValues={leaseValues}
            markCompleted={markCompleted}
            goNext={goNext}
            goPrev={goPrev}
          />
        );
      case "review":
        return (
          <ReviewStep
            typeValues={typeValues}
            tenantExistingValues={tenantExistingValues}
            tenantNewValues={tenantNewValues}
            representativeValues={representativeValues}
            representativeExistingValues={representativeExistingValues}
            leaseValues={leaseValues}
            representativeRequired={representativeRequired}
            goPrev={goPrev}
            handleFinalSubmit={handleFinalSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

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
            <CardDescription>
              Follow the steps to create a new lease
            </CardDescription>

            <div className="mt-4">
              <Tabs
                value={activeStep}
                onValueChange={(v) => tryChangeStep(v as StepKey)}
              >
                <TabsList className={`grid ${representativeRequired ? "grid-cols-5" : "grid-cols-4"} w-full mb-6`}>
                  {STEP_ORDER.map((step) => {
                    // Hide Representative tab if not required
                    if (step === "representative" && !representativeRequired)
                      return null;

                    return (
                      <TabsTrigger
                        key={step}
                        value={step}
                        disabled={
                          !completed[step] && STEP_ORDER.indexOf(step) > 0
                        }
                      >
                        {step.charAt(0).toUpperCase() + step.slice(1)}
                        {completed[step] && (
                          <IconCircleCheck
                            className="ml-2 inline-block"
                            size={14}
                          />
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="mt-4">
            {renderStep()}

            {submissionError && (
              <p className="text-red-600 mt-3">{submissionError}</p>
            )}
          </CardContent>
          <CardFooter>
            <p className="text-sm text-muted-foreground">
              Fields marked with <span className="text-red-500">*</span> are
              required.
            </p>
          </CardFooter>
        </Card>
      </Main>
    </>
  );
}

export default Leases;
