import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StepTypeSchema } from "../schemas";
import type { StepTypeValues } from "../types";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepTypeProps {
  initialValues: StepTypeValues | null;
  setTypeValues: (values: StepTypeValues) => void;
  markCompleted: (step: "type", ok: boolean) => void;
  resetDependentState: () => void;
  goNext: () => void;
}

export function StepType({
  initialValues,
  setTypeValues,
  markCompleted,
  resetDependentState,
  goNext,
}: StepTypeProps) {
  const form = useForm<StepTypeValues>({
    resolver: zodResolver(StepTypeSchema),
    defaultValues: initialValues || {
      renterType: "existing",
      leasingBy: "owner",
    },
  });

  const { handleSubmit } = form;

  function onSubmit(values: StepTypeValues) {
    setTypeValues(values);
    markCompleted("type", true);
    goNext();
  }

  // Effect to reset downstream state when type changes
  useEffect(() => {
    const sub = form.watch((v, { name }) => {
      // Trigger reset only on type changes, not just any watch update
      if (name === "renterType" || name === "leasingBy") {
        resetDependentState();
      }

      if (name === "leasingBy" && v.leasingBy !== "representative") {
        form.setValue("representativeType", undefined); 
      }

    });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use onBlur to save the data immediately when the step loses focus/data changes
  // This is how the original code was handling state updates.
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold tracking-tight">
        Lease Type Selection
      </h2>
      <hr className="my-4" />
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="renterType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base flex items-center gap-2">
                      <User /> Renter <span className="text-red-500">*</span>
                    </FormLabel>

                    <div className="flex gap-3">
                      {/* Existing Account */}
                      <Button
                        type="button"
                        variant={
                          field.value === "existing" ? "default" : "outline"
                        }
                        className="px-3 py-1.5 text-sm rounded-full"
                        onClick={() => field.onChange("existing")}
                      >
                        Existing account
                      </Button>

                      {/* New Account */}
                      <Button
                        type="button"
                        variant={field.value === "new" ? "default" : "outline"}
                        className="px-3 py-1.5 text-sm rounded-full"
                        onClick={() => field.onChange("new")}
                      >
                        New account
                      </Button>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 2. Who is Renting (Owner/Representative) */}
              <FormField
                control={form.control}
                name="leasingBy"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base flex items-center gap-2">
                      <Home /> Who is renting?
                      <span className="text-red-500">*</span>
                    </FormLabel>

                    <div className="flex gap-3">
                      {/* Owner Button */}
                      <Button
                        type="button"
                        variant={
                          field.value === "owner" ? "default" : "outline"
                        }
                        className="px-3 py-1.5 text-sm rounded-full"
                        onClick={() => field.onChange("owner")}
                      >
                        Owner
                      </Button>

                      {/* Representative Button */}
                      <Button
                        type="button"
                        variant={
                          field.value === "representative"
                            ? "default"
                            : "outline"
                        }
                        className="px-3 py-1.5 text-sm rounded-full"
                        onClick={() => field.onChange("representative")}
                      >
                        Representative
                      </Button>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Representative Type — Visible ONLY when leasingBy = representative */}
              {form.watch("leasingBy") === "representative" && (
                <FormField
                  control={form.control}
                  name="representativeType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base">
                        Representative Type
                      </FormLabel>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant={
                            field.value === "existing" ? "default" : "outline"
                          }
                          className="px-3 py-1.5 text-sm rounded-full"
                          onClick={() => field.onChange("existing")}
                        >
                          Existing Account
                        </Button>

                        <Button
                          type="button"
                          variant={
                            field.value === "new" ? "default" : "outline"
                          }
                          className="px-3 py-1.5 text-sm rounded-full"
                          onClick={() => field.onChange("new")}
                        >
                           New account
                        </Button>
                      </div>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          </div>
          <div className="pt-4 flex justify-between">
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
