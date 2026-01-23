import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { ApiError } from "@/types/api-error"
import type { Fee } from "@/types/types"

import { fetchAllFees } from "../../fees/lib/fees"
import { createUnitInvoice } from "../lib/invoices"
import { UnitSelect } from "../../units/components/unit-select"

const yyyyMmDd = (d: Date) => d.toISOString().split("T")[0]

const addDays = (dateStr: string, days: number) => {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return yyyyMmDd(d)
}

const formSchema = z
  .object({
    unit_id: z.number().min(1, "Unit is required"),
    total_amount: z.number().min(0, "Total amount must be 0 or greater"),
    issue_date: z.string().min(1, "Issue date is required"),
    due_date: z.string().min(1, "Due date is required"),
    source_id: z.number().min(1, "Fee is required"),
  })
  .refine(
    (v) => new Date(v.due_date) >= new Date(v.issue_date),
    { message: "Due date must be on or after issue date", path: ["due_date"] }
  )

type FormValues = z.infer<typeof formSchema>

interface AddInvoiceModalProps {
  onSuccess: () => void
  unitId?: number | null
}

export function AddInvoiceModal({
  onSuccess,
  unitId,
}: AddInvoiceModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fees, setFees] = useState<Fee[]>([])
  const [isLoadingFees, setIsLoadingFees] = useState(false)

  const hasUnitId = typeof unitId === "number" && unitId > 0
  const today = useMemo(() => yyyyMmDd(new Date()), [])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...(hasUnitId ? { unit_id: unitId! } : {}),
      total_amount: 0,
      issue_date: today,
      due_date: addDays(today, 10),
      source_id: 0, 
    },
  })

  const issueDate = form.watch("issue_date")

  const sourceId = form.watch("source_id");

  useEffect(() => {
    if (!sourceId || sourceId <= 0) {
      form.setValue("total_amount", 0, { shouldValidate: true });
      return;
    }

    const fee = fees.find((f) => Number(f.id) === Number(sourceId));
    const amount = Number((fee as Fee)?.amount) || 0;

    form.setValue("total_amount", amount, {
      shouldValidate: true,
      shouldDirty: true,
    });
    form.clearErrors("total_amount");
  }, [sourceId, fees, form]);

  // Track if user manually edited due date; if they did, don’t auto-overwrite it.
  const [dueDateTouched, setDueDateTouched] = useState(false)

  useEffect(() => {
    if (hasUnitId) {
      form.setValue("unit_id", unitId!, { shouldValidate: true, shouldDirty: true })
      form.clearErrors("unit_id")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnitId, unitId])

  useEffect(() => {
    if (!open) return
    let mounted = true

    ;(async () => {
      setIsLoadingFees(true)
      try {
        const list = await fetchAllFees("","active")
        if (mounted) setFees(list)
      } catch {
        toast.error("Failed to load fees")
      } finally {
        if (mounted) setIsLoadingFees(false)
      }
    })()

    return () => {
      mounted = false
    }
  }, [open])

  // Auto-calc due_date = issue_date + 10 days (unless user touched due date)
  useEffect(() => {
    if (!issueDate) return
    if (dueDateTouched) return
    form.setValue("due_date", addDays(issueDate, 10), { shouldValidate: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issueDate, dueDateTouched])

  const resetAll = () => {
    setDueDateTouched(false)
    form.reset({
      ...(hasUnitId ? { unit_id: unitId! } : {}),
      total_amount: 0,
      issue_date: today,
      due_date: addDays(today, 10),
      source_id: 0,
    })
  }

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const payload = hasUnitId ? { ...values, unit_id: unitId! } : values
      await createUnitInvoice(payload)
      toast.success("Invoice created successfully")
      setOpen(false)
      resetAll()
      onSuccess()
    } catch (error) {
      const err = error as ApiError
      if (err.status === 422 && err.data?.errors) {
        const fieldErrors = err.data.errors
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof FormValues, {
            type: "server",
            message: Array.isArray(messages) ? messages[0] : (messages as string),
          })
        })
      } else {
        toast.error(err.data?.message || "Failed to create invoice.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetAll()
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Create Invoice
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Create Unit Invoice</DialogTitle>
          <DialogDescription>
            Select a Fee (required) and enter invoice details.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Unit selector */}
            {!hasUnitId ? (
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Unit <span className="text-red-500">*</span>
                    </FormLabel>
                    <UnitSelect
                      value={field.value ?? null}
                      onChange={(v) => field.onChange(v ?? 0)}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Unit ID <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" value={field.value ?? unitId ?? ""} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Fee source_id (required) */}
            <Card className="p-4">
              <FormField
                control={form.control}
                name="source_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Fee <span className="text-red-500">*</span>
                    </FormLabel>

                    <Select
                      value={field.value && field.value > 0 ? String(field.value) : ""}
                      onValueChange={(v) => {
                        const id = Number(v)
                        field.onChange(id)
                        form.clearErrors("source_id")
                        form.trigger("source_id")
                      }}
                      disabled={isLoadingFees}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={isLoadingFees ? "Loading fees..." : "Select a fee"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {fees
                          .filter((f) => f.status !== "archived")
                          .map((fee) => (
                            <SelectItem key={fee.id.toString()} value={fee.id.toString()}>
                              {fee.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    {/* Small helper showing chosen fee name */}
                    <p className="text-xs text-muted-foreground mt-2">
                      Selected Fee:{" "}
                      <span className="font-medium">
                        {field.value && field.value > 0
                          ? fees.find((f) => Number(f.id) === Number(field.value))?.name ?? "—"
                          : "—"}
                      </span>
                    </p>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            {/* Invoice fields */}
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-4">
                  <FormField
                    control={form.control}
                    name="total_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Total Amount <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            value={field.value ?? 0}
                            disabled
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="sm:col-span-4">
                  <FormField
                    control={form.control}
                    name="issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Issue Date <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="sm:col-span-4">
                  <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Due Date <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value}
                            onChange={(e) => {
                              setDueDateTouched(true)
                              field.onChange(e.target.value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </Card>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>

              <Button type="submit" disabled={isSubmitting || form.watch("source_id") <= 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
