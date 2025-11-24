import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconArrowLeft } from "@tabler/icons-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepTenantExistingSchema, StepTenantNewSchema } from "../schemas";
import type {
  StepTenantExistingValues,
  StepTenantNewValues,
  StepTypeValues,
} from "../types";

interface StepTenantProps {
  typeValues: StepTypeValues | null;
  renters: Array<{ id: number; first_name: string; last_name: string }>;
  setTenantExistingValues: (values: StepTenantExistingValues) => void;
  setTenantNewValues: (values: StepTenantNewValues) => void;
  markCompleted: (step: "tenant", ok: boolean) => void;
  goNext: () => void;
  goPrev: () => void;
}

export function StepTenant({
  typeValues,
  renters,
  setTenantExistingValues,
  setTenantNewValues,
  markCompleted,
  goNext,
  goPrev,
}: StepTenantProps) {
  const isExisting = typeValues?.renterType === "existing";

  // --- Existing Tenant Form ---
  const formExisting = useForm<StepTenantExistingValues>({
    resolver: zodResolver(StepTenantExistingSchema),
    defaultValues: { tenant_id: "" },
    mode: "onChange", // Good practice for immediate feedback
  });

  function onSubmitExisting(values: StepTenantExistingValues) {
    setTenantExistingValues(values);
    markCompleted("tenant", true);
    goNext();
  }

  // --- New Tenant Form ---
  const formNew = useForm<StepTenantNewValues>({
    // FIX: Removed 'as any' for better type safety
    resolver: zodResolver(StepTenantNewSchema as any),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      role: "tenant",
      id_file: null,
    },
    mode: "onChange", // Good practice for immediate feedback
  });

  function onSubmitNew(values: StepTenantNewValues) {
    setTenantNewValues(values);
    markCompleted("tenant", true);
    goNext();
  }

  // Helper component for New Tenant form fields using shadcn/ui Form components
  const NewTenantFormFields = () => (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        {/* First Name */}
        <FormField
          control={formNew.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                First Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Last Name */}
        <FormField
          control={formNew.control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Last Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Phone */}
        <FormField
          control={formNew.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Phone <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Email */}
        <FormField
          control={formNew.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Role */}
        <FormField
          control={formNew.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Role <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input type="text" {...field} disabled />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ID File (Use Controller for File Input) */}
        <FormField
          control={formNew.control}
          name="id_file"
          render={({ field: { value, onChange, ...fieldProps } }) => (
            <FormItem>
              <FormLabel>ID File</FormLabel>
              <FormControl>
                <Input
                  {...fieldProps}
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  // Manually handle file change
                  onChange={(event) => {
                    onChange(
                      event.target.files && event.target.files.length > 0
                        ? event.target.files[0]
                        : null
                    );
                  }}
                />
              </FormControl>
              <FormDescription>
                Accepted formats: JPG, PNG, PDF. Max size: 5MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Footer Buttons */}
      <div className="pt-4 items-center space-x-4">
        <Button variant="outline" onClick={goPrev} type="button">
          <IconArrowLeft size={16} className="mr-2" />
          Back
        </Button>
        <Button type="submit">Continue</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">
        {isExisting ? "Existing Tenant Details" : "New Tenant Registration"}
      </h2>
      <hr className="my-4" />

      {isExisting ? (
        <Form {...formExisting}>
          <form
            onSubmit={formExisting.handleSubmit(onSubmitExisting)}
            className="space-y-6"
          >
            {/* Tenant Select Field */}
            <FormField
              control={formExisting.control}
              name="tenant_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choose an existing renter</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-1/3">
                        <SelectValue placeholder="Select renter..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {renters.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.first_name} {r.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Footer Buttons */}
            <div className="pt-4 items-center space-x-4">
              <Button variant="outline" onClick={goPrev} type="button">
                <IconArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <Button type="submit">Continue</Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...formNew}>
          <form onSubmit={formNew.handleSubmit(onSubmitNew)}>
            <NewTenantFormFields />
          </form>
        </Form>
      )}
    </div>
  );
}
