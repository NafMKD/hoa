import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { StepLeaseSchema } from "../schemas";
import type { StepLeaseValues, StepTypeValues } from "../types";
import { useEffect, useState } from "react";
import { fetchLeaseTemplates } from "../../../lib/lease";
import type { DocumentTemplate } from "@/types/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Props & Component Definition ---
interface StepLeaseProps {
  typeValues: StepTypeValues | null;
  setLeaseValues: (values: StepLeaseValues) => void;
  leaseValues: StepLeaseValues | null;
  markCompleted: (step: "lease", ok: boolean) => void;
  goNext: () => void;
  goPrev: () => void;
}

export function StepLease({
  typeValues,
  setLeaseValues,
  leaseValues,
  markCompleted,
  goNext,
  goPrev,
}: StepLeaseProps) {
  const [isTemplateLoading, setIsTemplateLoading] = useState(true);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);

  useEffect(() => {
    const loadTemplates = async () => {
      setIsTemplateLoading(true);
      try {
        const data = await fetchLeaseTemplates();
        setTemplates(data.data);
      } catch (error) {
        console.error("Error fetching lease templates:", error);
      } finally {
        setIsTemplateLoading(false);
      }
    };

    loadTemplates();
  }, []);

  const form = useForm<StepLeaseValues>({
    resolver: zodResolver(StepLeaseSchema),
    defaultValues: {
      agreement_amount: leaseValues?.agreement_amount,
      lease_template_id: leaseValues?.lease_template_id,
      lease_start_date: leaseValues?.lease_start_date ? leaseValues.lease_start_date : new Date().toISOString().split("T")[0],
      lease_end_date: leaseValues?.lease_end_date ? leaseValues.lease_end_date : new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0],
      representative_document: leaseValues?.representative_document,
      witness_1_full_name: leaseValues?.witness_1_full_name,
      witness_2_full_name: leaseValues?.witness_2_full_name,
      notes: leaseValues?.notes,
    },
  });

  function onSubmit(values: StepLeaseValues) {
    setLeaseValues(values);
    markCompleted("lease", true);
    goNext();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">
        Lease Agreement Details
      </h2>
      <hr className="my-4" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Agreement Amount (Number) */}
              <FormField
                control={form.control}
                name="agreement_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Agreement Amount <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        // Convert number field value back to number type for RHF
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                        className="pl-7"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lease Start Date */}
              <FormField
                control={form.control}
                name="lease_start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Lease Start Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lease End Date (Optional) */}
              <FormField
                control={form.control}
                name="lease_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lease End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Lease Template ID (Optional) */}
              {isTemplateLoading ? (
                <div className="md:col-span-2 lg:col-span-3 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="lease_template_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Lease Template <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Lease Template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=" ">
                              Select Lease Template
                            </SelectItem>
                            {templates.map((template) => (
                              <SelectItem
                                key={template.id}
                                value={template.id.toString()}
                              >
                                {template.name} - V{template.version}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Representative Document (File Input) */}
              {typeValues?.leasingBy === "representative" && (
                <FormField
                  control={form.control}
                  name="representative_document"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem className="md:col-span-1 lg:col-span-2">
                      {/* Full width for this section */}
                      <FormLabel>
                        Representative Document <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          {...fieldProps}
                          onChange={(event) => {
                            onChange(
                              event.target.files && event.target.files.length
                                ? event.target.files[0]
                                : null
                            );
                          }}
                          className="file:text-sm file:font-medium file:border-0 file:bg-primary/90 file:text-primary-foreground file:px-3 file:py-1 file:rounded-md file:mr-2 hover:file:bg-primary"
                          required={typeValues?.leasingBy === "representative"}
                        />
                      </FormControl>
                      <FormDescription>
                        Document authorizing the representative (e.g., Power of
                        Attorney).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Witness Section */}
              <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t">
                <h4 className="text-lg font-semibold sm:col-span-3 mb-0">
                  Witness Signatures (Optional)
                </h4>

                <FormField
                  control={form.control}
                  name="witness_1_full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness 1 Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Full Name"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="witness_2_full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Witness 2 Full Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Full Name"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes (Textarea) */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2 lg:col-span-3">
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any relevant notes for the lease agreement..."
                        {...field}
                        rows={4}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-6 flex justify-between border-t mt-6">
            <Button variant="outline" onClick={goPrev} type="button">
              <IconArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
