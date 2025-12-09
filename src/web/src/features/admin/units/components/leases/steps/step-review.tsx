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
  StepRepresentativeExistingValues,
} from "../types";
import { Link } from "@tanstack/react-router";
import React from "react";

interface ReviewStepProps {
  // State values collected from Leases.tsx
  typeValues: StepTypeValues | null;
  tenantExistingValues: StepTenantExistingValues | null;
  tenantNewValues: StepTenantNewValues | null;
  representativeValues: StepRepresentativeValues | null;
  representativeExistingValues: StepRepresentativeExistingValues | null;
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
    case "type": {
      const t = props.typeValues;
      if (!t) return null;

      const base = {
        "Renter Type": formatKey(t.renterType),
        "Leasing By": formatKey(t.leasingBy),
      };

      return t.representativeType
        ? {
            ...base,
            "Representative Type": formatKey(t.representativeType),
          }
        : base;
    }

    case "tenant":
      if (props.typeValues?.renterType === "existing") {
        if (!props.tenantExistingValues) return null;
        return {
          "Tenant ID": <Link to={`/admin/users/$userId`} params={{userId: props.tenantExistingValues.tenant_id.toString()}} target="_blank">{props.tenantExistingValues.tenant_id}</Link>,
        };
      } else {
        if (!props.tenantNewValues) return null;
        return {
          "First Name": props.tenantNewValues.first_name,
          "Last Name": props.tenantNewValues.last_name,
          Phone: props.tenantNewValues.phone,
          Email: props.tenantNewValues.email || "N/A",
          "ID File Attached": props.tenantNewValues.id_file?.name
            ? "Yes"
            : "No",
        };
      }

    case "representative":
      if (!props.representativeRequired) return null;

      if (props.typeValues?.representativeType === "existing") {
        if (!props.representativeExistingValues) return null;
        return {
          "Representative ID": <Link to={`/admin/users/$userId`} params={{userId: props.representativeExistingValues.representative_id.toString()}} target="_blank"> {props.representativeExistingValues.representative_id} </Link>
        };
      } else {
        if (!props.representativeValues) return null;
        return {
          "First Name": props.representativeValues.first_name,
          "Last Name": props.representativeValues.last_name,
          Phone: props.representativeValues.phone,
          Email: props.representativeValues.email || "N/A",
          "ID File Attached": props.representativeValues.id_file?.name
            ? "Yes"
            : "No",
        };
      }

    case "lease":
      if (!props.leaseValues) return null;
      return {
        "Agreement Amount": `ETB ${props.leaseValues.agreement_amount?.toLocaleString()}`,
        "Start Date": props.leaseValues.lease_start_date,
        "End Date": props.leaseValues.lease_end_date || "Open-ended",
        Notes: props.leaseValues.notes || "None",
        "Document Template ID": props.leaseValues.lease_template_id ? <Link to={`/admin/templates/$templateId`} params={{templateId: props.leaseValues.lease_template_id}} target="_blank"> {props.leaseValues.lease_template_id} </Link> : "Default Template", 
        "Representative Document": props.leaseValues.representative_document ? "Yes" : "No",
        "Witness 1 Name": props.leaseValues.witness_1_full_name || "N/A",
        "Witness 2 Name": props.leaseValues.witness_2_full_name || "N/A",
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
            {React.isValidElement(value)
                ? value
                : String(value) ?? "N/A"}
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