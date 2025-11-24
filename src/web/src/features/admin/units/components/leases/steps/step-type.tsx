import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StepTypeSchema } from "../schemas";
import type { StepTypeValues } from "../types";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
    const sub = form.watch((_v, { name }) => {
      // Trigger reset only on type changes, not just any watch update
      if (name === "renterType" || name === "leasingBy") {
        resetDependentState();
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
                  <FormLabel className="text-base">
                    <User /> Renter <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      {/* Option 1: Existing Account */}
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem
                            value="existing"
                            id="renter-existing"
                          />
                        </FormControl>
                        <Label
                          htmlFor="renter-existing"
                          className="cursor-pointer"
                        >
                          Existing account
                        </Label>
                      </FormItem>

                      {/* Option 2: New Account */}
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="new" id="renter-new" />
                        </FormControl>
                        <Label htmlFor="renter-new" className="cursor-pointer">
                          New account
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
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
                  <FormLabel className="text-base">
                    <Home /> Who is renting?{" "}
                    <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-2"
                    >
                      {/* Option 1: Owner */}
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="owner" id="leasing-owner" />
                        </FormControl>
                        <Label
                          htmlFor="leasing-owner"
                          className="cursor-pointer"
                        >
                          Owner
                        </Label>
                      </FormItem>

                      {/* Option 2: Representative */}
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem
                            value="representative"
                            id="leasing-rep"
                          />
                        </FormControl>
                        <Label htmlFor="leasing-rep" className="cursor-pointer">
                          Representative
                        </Label>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
