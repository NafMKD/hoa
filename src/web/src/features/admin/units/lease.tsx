import React, { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input"; // if you have shadcn inputs; else use native <input>
import { Textarea } from "@/components/ui/textarea"; // optional
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";

/**
 * Types for step keys
 */
type StepKey = "type" | "tenant" | "representative" | "lease";

/**
 * -------------------------
 * Zod Schemas for each step
 * -------------------------
 */

/* Step 1: Type selection */
const StepTypeSchema = z.object({
  renterType: z.enum(["existing", "new"]),
  leasingBy: z.enum(["owner", "representative"]),
});

/* Tenant - existing */
const StepTenantExistingSchema = z.object({
  tenant_id: z.string().min(1, "Select a tenant"),
});

/* Tenant - new (same validation as backend expects for users) */
const StepTenantNewSchema = z.object({
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Phone must be a 10 digit Ethiopian number starting with 0")
    .max(255),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v === "" ? null : v)).nullable(),
  password: z.string().min(8).optional().nullable(),
  id_file: z
    .any()
    .optional()
    .nullable(), // will be handled in formData upload
});

/* Representative */
const StepRepresentativeSchema = z.object({
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  phone: z
    .string()
    .regex(/^0\d{9}$/, "Phone must be a 10 digit Ethiopian number starting with 0")
    .max(255),
  email: z.string().email().optional().or(z.literal("")).transform((v) => (v === "" ? null : v)).nullable(),
  password: z.string().min(8).optional().nullable(),
  id_file: z.any().optional().nullable(),
});

/* Lease details */
const StepLeaseSchema = z.object({
  unit_id: z.string().min(1),
  agreement_type: z.enum(["owner", "representative"]),
  agreement_amount: z.coerce.number().min(0),
  lease_template_id: z.string().optional().nullable(),
  lease_start_date: z.string().min(1),
  lease_end_date: z.string().optional().nullable(),
  representative_document: z.any().optional().nullable(),
  witness_1_full_name: z.string().optional().nullable(),
  witness_2_full_name: z.string().optional().nullable(),
  witness_3_full_name: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/* Combined (for typing) */
type StepTypeValues = z.infer<typeof StepTypeSchema>;
type StepTenantExistingValues = z.infer<typeof StepTenantExistingSchema>;
type StepTenantNewValues = z.infer<typeof StepTenantNewSchema>;
type StepRepresentativeValues = z.infer<typeof StepRepresentativeSchema>;
type StepLeaseValues = z.infer<typeof StepLeaseSchema>;

/**
 * -------------------------
 * API helper placeholders
 * Replace these with your actual API calls.
 * -------------------------
 */
async function fetchRenters(): Promise<Array<{ id: number; first_name: string; last_name: string; phone?: string }>> {
  // TODO: replace with real API
  return [
    { id: 101, first_name: "Alem", last_name: "Bekele", phone: "0912345678" },
    { id: 102, first_name: "Martha", last_name: "Yared", phone: "0911111111" },
  ];
}

async function submitLease(formData: FormData): Promise<{ pdf_url?: string; lease_id?: number }> {
  // TODO: replace with real POST to backend
  // Example:
  // const res = await fetch("/api/admin/leases", { method: "POST", body: formData });
  // return await res.json();
  await new Promise((r) => setTimeout(r, 1200));
  return { pdf_url: "/dummy/lease.pdf", lease_id: 555 };
}

/**
 * -------------------------
 * Main Component
 * -------------------------
 */
export function Leases() {
  const [activeStep, setActiveStep] = useState<StepKey>("type");
  const [completed, setCompleted] = useState<Record<StepKey, boolean>>({
    type: false,
    tenant: false,
    representative: false,
    lease: false,
  });

  // Values collected from each step
  const [typeValues, setTypeValues] = useState<StepTypeValues | null>(null);
  const [tenantExistingValues, setTenantExistingValues] = useState<StepTenantExistingValues | null>(null);
  const [tenantNewValues, setTenantNewValues] = useState<StepTenantNewValues | null>(null);
  const [representativeValues, setRepresentativeValues] = useState<StepRepresentativeValues | null>(null);
  const [leaseValues, setLeaseValues] = useState<StepLeaseValues | null>(null);

  const [renters, setRenters] = useState<Array<{ id: number; first_name: string; last_name: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Load existing renters for the dropdown
  useEffect(() => {
    let mounted = true;
    fetchRenters().then((r) => {
      if (mounted) setRenters(r);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // order of steps
  const STEP_ORDER: StepKey[] = ["type", "tenant", "representative", "lease"];

  // Helper to determine if representative step is required
  const representativeRequired = useMemo(() => {
    return typeValues?.leasingBy === "representative";
  }, [typeValues]);

  // Attempt to change step (prevent forward jump if previous steps incomplete)
  function tryChangeStep(next: StepKey) {
    const nextIndex = STEP_ORDER.indexOf(next);
    const allPrevComplete = STEP_ORDER.slice(0, nextIndex).every((k) => {
      if (k === "representative" && !representativeRequired) {
        // skip representative if not required
        return true;
      }
      return completed[k];
    });

    if (allPrevComplete) {
      setActiveStep(next);
    } else {
      // optionally show toast / focus first incomplete
      // For simplicity we just block
      console.warn("Cannot jump forward - previous steps incomplete");
    }
  }

  // mark step completed
  function markCompleted(step: StepKey, ok = true) {
    setCompleted((prev) => ({ ...prev, [step]: ok }));
  }

  // Navigation handlers
  function goNext() {
    const idx = STEP_ORDER.indexOf(activeStep);
    let nextIdx = idx + 1;

    // If representative isn't required and next is representative, skip it
    if (STEP_ORDER[nextIdx] === "representative" && !representativeRequired) {
      nextIdx++;
    }
    if (nextIdx < STEP_ORDER.length) {
      const next = STEP_ORDER[nextIdx];
      setActiveStep(next);
    }
  }
  function goPrev() {
    const idx = STEP_ORDER.indexOf(activeStep);
    let prevIdx = idx - 1;
    // if representative not required and previous is representative, skip back further
    if (STEP_ORDER[prevIdx] === "representative" && !representativeRequired) {
      prevIdx--;
    }
    if (prevIdx >= 0) {
      setActiveStep(STEP_ORDER[prevIdx]);
    }
  }

  // Final submit: combine validated values and send to backend
  async function handleFinalSubmit() {
    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      // ensure we have leaseValues and tenant info
      if (!typeValues || !leaseValues) {
        throw new Error("Missing data");
      }

      const fd = new FormData();

      // tenant
      if (typeValues.renterType === "existing") {
        if (!tenantExistingValues) throw new Error("Tenant selection missing");
        fd.append("tenant_id", tenantExistingValues.tenant_id);
      } else {
        // create new user fields; backend expects role tenant for new renter
        if (!tenantNewValues) throw new Error("New tenant info missing");
        fd.append("first_name", tenantNewValues.first_name);
        fd.append("last_name", tenantNewValues.last_name);
        fd.append("phone", tenantNewValues.phone);
        if (tenantNewValues.email) fd.append("email", tenantNewValues.email);
        if (tenantNewValues.password) fd.append("password", tenantNewValues.password);
        fd.append("role", "tenant");
        if (tenantNewValues.id_file && tenantNewValues.id_file.length > 0) {
          fd.append("id_file", tenantNewValues.id_file[0]);
        }
      }

      // representative
      if (typeValues.leasingBy === "representative") {
        if (!representativeValues) throw new Error("Representative info missing");
        // if representative was existing in the system we'd have representative id flow, but we only collected new rep details in this implementation
        fd.append("representative_first_name", representativeValues.first_name);
        fd.append("representative_last_name", representativeValues.last_name);
        fd.append("representative_phone", representativeValues.phone);
        if (representativeValues.email) fd.append("representative_email", representativeValues.email);
        if (representativeValues.password) fd.append("representative_password", representativeValues.password);
        fd.append("representative_role", "representative");
        if (representativeValues.id_file && representativeValues.id_file.length > 0) {
          fd.append("representative_document", representativeValues.id_file[0]);
        }
      }

      // Lease fields (unit_id, agreement_type, amounts, dates etc.)
      // Using the backend expected keys
      fd.append("unit_id", leaseValues.unit_id);
      // the tenant_id was appended above in existing case; in new case backend should handle creating tenant + returning id (depends on backend)
      // but we still include agreement fields
      fd.append("agreement_type", leaseValues.agreement_type);
      fd.append("agreement_amount", String(leaseValues.agreement_amount));
      if (leaseValues.lease_template_id) fd.append("lease_template_id", leaseValues.lease_template_id);
      fd.append("lease_start_date", leaseValues.lease_start_date);
      if (leaseValues.lease_end_date) fd.append("lease_end_date", leaseValues.lease_end_date);
      if (leaseValues.representative_document && leaseValues.representative_document.length > 0) {
        fd.append("representative_document", leaseValues.representative_document[0]);
      }
      if (leaseValues.witness_1_full_name) fd.append("witness_1_full_name", leaseValues.witness_1_full_name);
      if (leaseValues.witness_2_full_name) fd.append("witness_2_full_name", leaseValues.witness_2_full_name);
      if (leaseValues.witness_3_full_name) fd.append("witness_3_full_name", leaseValues.witness_3_full_name);
      if (leaseValues.notes) fd.append("notes", leaseValues.notes);

      // Submit to API
      const res = await submitLease(fd);

      if (res.pdf_url) {
        setPdfUrl(res.pdf_url);
      }

      // Optionally redirect to lease detail page if res.lease_id exists:
      // router.navigate(`/admin/leases/${res.lease_id}`)
    } catch (err: any) {
      console.error(err);
      setSubmissionError(err?.message || "Unable to submit lease");
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * -------------------------
   * Child Step Components
   * Using inner components so code is in a single file for easier copy/paste.
   * You can move them to separate files if you prefer.
   * -------------------------
   */

  function StepType() {
    const form = useForm<StepTypeValues>({
      resolver: zodResolver(StepTypeSchema),
      defaultValues: {
        renterType: "existing",
        leasingBy: "owner",
      },
    });

    const { handleSubmit, register, watch } = form;

    function onSubmit(values: StepTypeValues) {
      setTypeValues(values);
      markCompleted("type", true);
    }

    // When user changes selection, mark incomplete dependent steps
    useEffect(() => {
      const sub = form.watch((v) => {
        // reset downstream completion when type changes
        setCompleted((prev) => ({ ...prev, tenant: false, representative: false, lease: false }));
        setTenantExistingValues(null);
        setTenantNewValues(null);
        setRepresentativeValues(null);
        setLeaseValues(null);
      });
      return () => sub.unsubscribe();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <form onBlur={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground">Renter</label>
            <div className="mt-2 flex items-center space-x-3">
              <label className="inline-flex items-center space-x-2">
                <input {...register("renterType")} type="radio" value="existing" defaultChecked />
                <span>Existing account</span>
              </label>
              <label className="inline-flex items-center space-x-2">
                <input {...register("renterType")} type="radio" value="new" />
                <span>New account</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground">Who is renting?</label>
            <div className="mt-2 flex items-center space-x-3">
              <label className="inline-flex items-center space-x-2">
                <input {...register("leasingBy")} type="radio" value="owner" defaultChecked />
                <span>Owner</span>
              </label>
              <label className="inline-flex items-center space-x-2">
                <input {...register("leasingBy")} type="radio" value="representative" />
                <span>Representative</span>
              </label>
            </div>
          </div>
        </div>
      </form>
    );
  }

  function StepTenant() {
    const isExisting = typeValues?.renterType === "existing";

    // Existing form
    const formExisting = useForm<StepTenantExistingValues>({
      resolver: zodResolver(StepTenantExistingSchema),
      defaultValues: { tenant_id: "" },
    });

    // New tenant form
    const formNew = useForm<StepTenantNewValues>({
      resolver: zodResolver(StepTenantNewSchema as any),
      defaultValues: {
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        password: "",
        id_file: null,
      },
    });

    function onSubmitExisting(values: StepTenantExistingValues) {
      setTenantExistingValues(values);
      markCompleted("tenant", true);
    }

    function onSubmitNew(values: StepTenantNewValues) {
      setTenantNewValues(values);
      markCompleted("tenant", true);
    }

    return (
      <div className="space-y-4">
        {isExisting ? (
          <form
            onSubmit={formExisting.handleSubmit((v) => {
              onSubmitExisting(v);
              goNext();
            })}
            className="space-y-2"
          >
            <label className="text-sm text-muted-foreground">Choose an existing renter</label>
            <select
              {...formExisting.register("tenant_id")}
              className="w-full border rounded px-2 py-2"
              defaultValue=""
            >
              <option value="" disabled>
                Select renter...
              </option>
              {renters.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.first_name} {r.last_name} 
                </option>
              ))}
            </select>

            <div className="pt-2 flex justify-between">
              <Button variant="ghost" onClick={goPrev} type="button">
                <IconArrowLeft size={14} className="mr-2" />
                Back
              </Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={formNew.handleSubmit((v) => {
              onSubmitNew(v);
              goNext();
            })}
            className="space-y-3"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <input {...formNew.register("first_name")} placeholder="First name" className="input" />
              <input {...formNew.register("last_name")} placeholder="Last name" className="input" />
              <input {...formNew.register("phone")} placeholder="Phone (0XXXXXXXXX)" className="input" />
              <input {...formNew.register("email")} placeholder="Email (optional)" className="input" />
              <input {...formNew.register("password")} type="password" placeholder="Password (optional)" className="input" />
              <div>
                <label className="block text-sm text-muted-foreground">ID File (jpg, png, pdf)</label>
                <input
                  type="file"
                  {...formNew.register("id_file")}
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="mt-1"
                />
              </div>
            </div>
          </form>
        )}
      </div>
    );
  }

  function StepRepresentative() {
    // If representative is not required, allow user to click continue (mark completed)
    const form = useForm<StepRepresentativeValues>({
      resolver: zodResolver(StepRepresentativeSchema as any),
      defaultValues: {
        first_name: "",
        last_name: "",
        phone: "",
        email: "",
        password: "",
        id_file: null,
      },
    });

    function onSubmit(values: StepRepresentativeValues) {
      setRepresentativeValues(values);
      markCompleted("representative", true);
    }

    return (
      <form
        onSubmit={form.handleSubmit((v) => {
          onSubmit(v);
          goNext();
        })}
        className="space-y-3"
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <input {...form.register("first_name")} placeholder="First name" className="input" />
          <input {...form.register("last_name")} placeholder="Last name" className="input" />
          <input {...form.register("phone")} placeholder="Phone (0XXXXXXXXX)" className="input" />
          <input {...form.register("email")} placeholder="Email (optional)" className="input" />
          <input {...form.register("password")} placeholder="Password (optional)" className="input" />
          <div>
            <label className="block text-sm text-muted-foreground">ID File (jpg, png, pdf)</label>
            <input type="file" {...form.register("id_file")} accept=".jpg,.jpeg,.png,.pdf" className="mt-1" />
          </div>
        </div>
      </form>
    );
  }

  function StepLease() {
    const form = useForm<StepLeaseValues>({
      resolver: zodResolver(StepLeaseSchema as any),
      defaultValues: {
        unit_id: "",
        agreement_type: (typeValues?.leasingBy ?? "owner") as "owner" | "representative",
        agreement_amount: 0,
        lease_template_id: null,
        lease_start_date: "",
        lease_end_date: null,
        representative_document: null,
        witness_1_full_name: null,
        witness_2_full_name: null,
        witness_3_full_name: null,
        notes: null,
      },
    });

    function onSubmit(values: StepLeaseValues) {
      setLeaseValues(values);
      markCompleted("lease", true);
      // call final submit or move to review step
    }

    return (
      <form
        onSubmit={form.handleSubmit((v) => {
          onSubmit(v);
          // auto submit final payload after lease step validated
          handleFinalSubmit();
        })}
        className="space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <input {...form.register("unit_id")} placeholder="Unit ID" className="input" />
          <select {...form.register("agreement_type")} className="input">
            <option value="owner">Owner</option>
            <option value="representative">Representative</option>
          </select>
          <input {...form.register("agreement_amount")} placeholder="Agreement amount" type="number" className="input" />
          <input {...form.register("lease_template_id")} placeholder="Template ID (optional)" className="input" />
          <input {...form.register("lease_start_date")} type="date" className="input" />
          <input {...form.register("lease_end_date")} type="date" className="input" />
          <div>
            <label className="block text-sm text-muted-foreground">Representative document (optional)</label>
            <input type="file" {...form.register("representative_document")} accept=".pdf,.jpg,.jpeg,.png" className="mt-1" />
          </div>
          <input {...form.register("witness_1_full_name")} placeholder="Witness 1 (optional)" className="input" />
          <input {...form.register("witness_2_full_name")} placeholder="Witness 2 (optional)" className="input" />
          <input {...form.register("witness_3_full_name")} placeholder="Witness 3 (optional)" className="input" />
          <Textarea {...form.register("notes")} placeholder="Notes (optional)" />
        </div>
      </form>
    );
  }

  /**
   * -------------------------
   * Render
   * -------------------------
   */
  return (
    <>
      <Header fixed>
        {/* add header actions if you have them */}
      </Header>

      <Main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Create Lease</h1>
        </div>

        <Card className="shadow-sm border-muted">
          <CardHeader>
            <CardTitle>Create Lease</CardTitle>
            <CardDescription>Follow steps to create lease and generate PDF</CardDescription>

            <div className="mt-4">
              <Tabs value={activeStep} onValueChange={(v) => tryChangeStep(v as StepKey)}>
                <TabsList className="flex space-x-2">
                  <TabsTrigger value="type">Type</TabsTrigger>
                  <TabsTrigger value="tenant" disabled={false}>
                    Tenant
                  </TabsTrigger>
                  <TabsTrigger value="representative">Representative</TabsTrigger>
                  <TabsTrigger value="lease">Lease</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="mt-4">
            {activeStep === "type" && <StepType />}
            {activeStep === "tenant" && <StepTenant />}
            {activeStep === "representative" && <StepRepresentative />}
            {activeStep === "lease" && <StepLease />}

            {pdfUrl && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Generated Lease</h3>
                <div className="border rounded overflow-hidden">
                  <iframe src={pdfUrl} title="Lease PDF" className="w-full h-[600px]" />
                </div>
                <div className="mt-2">
                  <Button
                    onClick={() => {
                      // try to open print on the pdf in a new window
                      window.open(pdfUrl, "_blank");
                    }}
                  >
                    Open / Print
                  </Button>
                </div>
              </div>
            )}

            {submissionError && <p className="text-red-600 mt-3">{submissionError}</p>}
          </CardContent>

          <CardFooter className="flex justify-between">
            <div>
              <Button variant="ghost" onClick={goPrev} disabled={activeStep === "type"}>
                <IconArrowLeft size={14} className="mr-2" />
                Back
              </Button>
            </div>

            <div>
              {/* If not on lease step, show Next */}
              {activeStep !== "lease" && (
                <Button
                  onClick={() => {
                    // require completed status for current step before moving forward (or try to auto-validate)
                    // For simplicity, check completed map
                    if (!completed[activeStep]) {
                      // Try to programmatically trigger validation/submit for the step component —
                      // but our child forms already call markCompleted when they are valid (on blur/submit)
                      // So we simply warn and prevent
                      console.warn("Complete the current step before proceeding");
                      return;
                    }
                    goNext();
                  }}
                >
                  Next <IconArrowRight size={14} className="ml-2" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </Main>
    </>
  );
}

export default Leases;
