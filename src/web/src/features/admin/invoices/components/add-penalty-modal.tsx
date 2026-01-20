import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Plus, Trash2 } from "lucide-react"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { ApiError } from "@/types/api-error"
import type { Fee, PenaltyPayload } from "@/types/types"
import { InvoiceSelect } from "../../invoices/components/invoice-select"
import { fetchAllFees, fetchFeeDetail } from "../../fees/lib/fees"
import { createInvoicePenalties } from "../lib/invoices"

const penaltyItemSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  reason: z.string().min(1, "Description is required"),
  applied_date: z.string().min(1, "Applied date is required"),
})

const formSchema = z.object({
  invoice_id: z.number().min(1, "Invoice ID is required"),
  penalties: z.array(penaltyItemSchema), 
})

type FormValues = z.infer<typeof formSchema>

const customPenaltySchema = penaltyItemSchema

type CustomPenalty = z.infer<typeof customPenaltySchema>

interface AddPenaltyModalProps {
  onSuccess: () => void
  invoiceId?: number | null
}

export function AddPenaltyModal({ onSuccess, invoiceId }: AddPenaltyModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fees, setFees] = useState<Fee[]>([])
  const [isLoadingFees, setIsLoadingFees] = useState(false)
  const [selectedFeeId, setSelectedFeeId] = useState<string>("")
  const [isAddingFee, setIsAddingFee] = useState(false)

  const hasInvoiceId = typeof invoiceId === "number" && invoiceId > 0
  const today = useMemo(() => new Date().toISOString().split("T")[0], [])

  const [custom, setCustom] = useState<CustomPenalty>({
    reason: "",
    amount: 0,
    applied_date: today,
  })
  const [customErrors, setCustomErrors] = useState<Partial<Record<keyof CustomPenalty, string>>>(
    {}
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...(hasInvoiceId ? { invoice_id: invoiceId! } : {}),
      penalties: [], 
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "penalties",
  })

  useEffect(() => {
    if (hasInvoiceId) {
      form.setValue("invoice_id", invoiceId!, {
        shouldValidate: true,
        shouldDirty: true,
      })
      form.clearErrors("invoice_id")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInvoiceId, invoiceId])

  useEffect(() => {
    if (!open) return
    let mounted = true

    ;(async () => {
      setIsLoadingFees(true)
      try {
        const list = await fetchAllFees('fine', 'active')
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

  const resetAll = () => {
    form.reset({
      ...(hasInvoiceId ? { invoice_id: invoiceId! } : {}),
      penalties: [],
    })
    setSelectedFeeId("")
    setCustom({ reason: "", amount: 0, applied_date: today })
    setCustomErrors({})
  }

  const validateAndAddCustom = () => {
    const parsed = customPenaltySchema.safeParse(custom)
    if (!parsed.success) {
      const errs: Partial<Record<keyof CustomPenalty, string>> = {}
      parsed.error.issues.forEach((i) => {
        const key = i.path[0] as keyof CustomPenalty
        errs[key] = i.message
      })
      setCustomErrors(errs)
      return
    }

    setCustomErrors({})
    append(parsed.data)
    setCustom({ reason: "", amount: 0, applied_date: today })
  }

  const addFeeAsPenalty = async () => {
    if (!selectedFeeId) return
    setIsAddingFee(true)
    try {
      const fee = await fetchFeeDetail(selectedFeeId)
      append({
        reason: fee.name,
        amount: Number(fee.amount) || 0,
        applied_date: today,
      })
      setSelectedFeeId("")
    } catch {
      toast.error("Failed to fetch fee details")
    } finally {
      setIsAddingFee(false)
    }
  }

  async function onSubmit(values: FormValues) {
    // If table empty => do NOT send
    if (!values.penalties || values.penalties.length === 0) {
      toast.error("Add at least one penalty before submitting.")
      return
    }

    setIsSubmitting(true)
    try {
      const payload: PenaltyPayload = hasInvoiceId
        ? { ...values, invoice_id: invoiceId! }
        : values

      await createInvoicePenalties(payload)
      toast.success("Penalties added successfully")
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
        toast.error(err.data?.message || "Failed to add penalties.")
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
        <Button variant="destructive" className="gap-2 shadow-sm">
          <Plus className="h-4 w-4" /> Add Penalty
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader>
          <DialogTitle>Add Penalties</DialogTitle>
          <DialogDescription>
            Add penalties using a Fee fines or a custom entry. 
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* invoice selector */}
            {!hasInvoiceId ? (
              <FormField
                control={form.control}
                name="invoice_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Invoice Ref <span className="text-red-500">*</span>
                    </FormLabel>
                    <InvoiceSelect
                      value={field.value ?? null}
                      onChange={field.onChange}
                      status={["issued", "partial", "overdue"]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="invoice_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Invoice ID <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" value={field.value ?? invoiceId ?? ""} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Fee quick add */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                <div className="flex-1">
                  <FormLabel className="mb-3">Quick add from Fee</FormLabel>
                  <Select
                    value={selectedFeeId}
                    onValueChange={setSelectedFeeId}
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
                </div>

                <Button
                  type="button"
                  onClick={addFeeAsPenalty}
                  disabled={!selectedFeeId || isAddingFee || isLoadingFees}
                >
                  {isAddingFee && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Fee
                </Button>
              </div>
            </Card>

            {/* SINGLE custom input row */}
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-6">
                  <FormLabel className="mb-3">
                    Description <span className="text-red-500">*</span>
                  </FormLabel>
                  <Input
                    value={custom.reason}
                    onChange={(e) => {
                      setCustom((p) => ({ ...p, reason: e.target.value }))
                      setCustomErrors((p) => ({ ...p, reason: undefined }))
                    }}
                    placeholder="Late payment penalty..."
                  />
                  {customErrors.reason && (
                    <p className="text-sm text-destructive mt-1">{customErrors.reason}</p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <FormLabel className="mb-3">
                    Amount <span className="text-red-500">*</span>
                  </FormLabel>
                  <Input
                    type="number"
                    value={custom.amount}
                    min={0}
                    onChange={(e) => {
                      setCustom((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))
                      setCustomErrors((p) => ({ ...p, amount: undefined }))
                    }}
                  />
                  {customErrors.amount && (
                    <p className="text-sm text-destructive mt-1">{customErrors.amount}</p>
                  )}
                </div>

                <div className="sm:col-span-3">
                  <FormLabel className="mb-3">
                    Applied Date <span className="text-red-500">*</span>
                  </FormLabel>
                  <Input
                    type="date"
                    value={custom.applied_date}
                    onChange={(e) => {
                      setCustom((p) => ({ ...p, applied_date: e.target.value }))
                      setCustomErrors((p) => ({ ...p, applied_date: undefined }))
                    }}
                  />
                  {customErrors.applied_date && (
                    <p className="text-sm text-destructive mt-1">
                      {customErrors.applied_date}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-12 flex justify-end">
                  <Button type="button" variant="outline" onClick={validateAndAddCustom}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Penalty
                  </Button>
                </div>
              </div>
            </Card>

            {/* Table is the only list of penalties */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-medium">Penalties to Submit</p>
                <p className="text-xs text-muted-foreground">
                  {fields.length === 0
                    ? "No penalties added yet."
                    : "These will all be submitted together."}
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Applied Date</TableHead>
                    <TableHead className="w-[90px] text-right pr-4">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {fields.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                        Add a fee or a custom penalty to populate this table.
                      </TableCell>
                    </TableRow>
                  ) : (
                    form.watch("penalties")?.map((p, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{p.reason || "—"}</TableCell>
                        <TableCell className="text-right">{Number(p.amount) || 0}</TableCell>
                        <TableCell className="text-right">{p.applied_date || "—"}</TableCell>
                        <TableCell className="text-right pr-4">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              if (fields.length === 1) replace([]) 
                              else remove(idx)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || fields.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Penalties
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
