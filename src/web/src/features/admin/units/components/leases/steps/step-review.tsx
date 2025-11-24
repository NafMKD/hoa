import { Button } from "@/components/ui/button";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconArrowLeft } from "@tabler/icons-react";
import type {
  StepKey,
  StepTypeValues,
  StepTenantExistingValues,
  StepTenantNewValues,
  StepRepresentativeValues,
  StepLeaseValues,
} from "../types";

interface ReviewStepProps {
  // State values collected from Leases.tsx
  typeValues: StepTypeValues | null;
  tenantExistingValues: StepTenantExistingValues | null;
  tenantNewValues: StepTenantNewValues | null;
  representativeValues: StepRepresentativeValues | null;
  leaseValues: StepLeaseValues | null;
  
  representativeRequired: boolean;
  isSubmitting: boolean;
  goPrev: () => void;
  handleFinalSubmit: () => Promise<void>;
}

// Helper function to format display names
const formatKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b(\w)/g, (s) => s.toUpperCase());

const getSectionData = (
  section: StepKey,
  props: ReviewStepProps
): Record<string, any> | null => {
  switch (section) {
    case "type":
      if (!props.typeValues) return null;
      return {
        "Renter Type": formatKey(props.typeValues.renterType),
        "Leasing By": formatKey(props.typeValues.leasingBy),
      };
      
    case "tenant":
      if (props.typeValues?.renterType === "existing") {
        if (!props.tenantExistingValues) return null;
        return {
          "Tenant ID": props.tenantExistingValues.tenant_id,
        };
      } else {
        if (!props.tenantNewValues) return null;
        return {
          "First Name": props.tenantNewValues.first_name,
          "Last Name": props.tenantNewValues.last_name,
          Phone: props.tenantNewValues.phone,
          Email: props.tenantNewValues.email || "N/A",
          "ID File Attached": props.tenantNewValues.id_file?.[0]?.name ? "Yes" : "No",
        };
      }
      
    case "representative":
      if (!props.representativeRequired || !props.representativeValues) return null;
      return {
        "First Name": props.representativeValues.first_name,
        "Last Name": props.representativeValues.last_name,
        Phone: props.representativeValues.phone,
        Email: props.representativeValues.email || "N/A",
        "ID File Attached": props.representativeValues.id_file?.[0]?.name ? "Yes" : "No",
      };
      
    case "lease":
      if (!props.leaseValues) return null;
      return {
        // "Unit ID": props.leaseValues.unit_id,
        // "Agreement Type": formatKey(props.leaseValues.agreement_type),
        "Agreement Amount": `ETB ${props.leaseValues.agreement_amount?.toLocaleString()}`,
        "Start Date": props.leaseValues.lease_start_date,
        "End Date": props.leaseValues.lease_end_date || "Open-ended",
        Notes: props.leaseValues.notes || "None",
      };
      
    default:
      return {};
  }
};

const ReviewSection = ({ title, data }: { title: string; data: Record<string, any> | null }) => {
  if (!data) return (
    <div className="text-sm text-yellow-600">
      *Missing or incomplete data for this section.*
    </div>
  );
  
  return (
    <div className="border-b pb-4 mb-4 last:border-b-0 last:pb-0">
      <h4 className="text-lg font-semibold mb-2 text-primary-900">{title}</h4>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <span className="text-muted-foreground font-medium">{key}</span>
            <span className="font-medium text-gray-800 break-words">
              {String(value) || "N/A"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function ReviewStep(props: ReviewStepProps) {
  const sections: { key: StepKey; title: string }[] = [
    { key: "type", title: "Lease Type & Roles" },
    { key: "tenant", title: "Tenant Details" },
    ...(props.representativeRequired ? [{ key: "representative" as StepKey, title: "Representative Details" }] : []),
    { key: "lease", title: "Lease Terms & Dates" },
  ];

  return (
    <div className="space-y-6">
      <CardHeader className="p-0">
        <CardTitle className="text-xl">Final Review</CardTitle>
        <CardDescription>
          Please review all the information below before submitting the lease agreement.
        </CardDescription>
      </CardHeader>
      
      <div className="p-0 space-y-6">
        {sections.map(({ key, title }) => (
          <ReviewSection
            key={key}
            title={title}
            data={getSectionData(key, props)}
          />
        ))}
      </div>

      <div className="pt-4 flex justify-between border-t">
        <Button variant="ghost" onClick={props.goPrev} type="button">
          <IconArrowLeft size={14} className="mr-2" />
          Back
        </Button>
        <Button
          onClick={props.handleFinalSubmit}
          disabled={props.isSubmitting}
        >
          {props.isSubmitting ? (
            "Submitting..."
          ) : (
            <>
              Submit
            </>
          )}
        </Button>
      </div>
    </div>
  );
}