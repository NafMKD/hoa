import { useMemo, useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, FileText, CalendarIcon } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import type { ApiError } from "@/types/api-error"
import type { Fee } from "@/types/types"
import { generateInvoices, fetchAllFees } from "../lib/fees"

const QUARTER_ORDER = ["sep-nov", "dec-feb", "mar-may", "jun-aug"] as const

const QUARTER_MONTHS: Record<string, [number, number, number]> = {
  "sep-nov": [9, 10, 11],
  "dec-feb": [12, 1, 2],
  "mar-may": [3, 4, 5],
  "jun-aug": [6, 7, 8],
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function formatQuarterLabel(quarter: string, year: number): string {
  const months = QUARTER_MONTHS[quarter]
  if (!months) return quarter

  const labels = months.map((m) => {
    const y = quarter === "dec-feb" && m <= 2 ? year + 1 : year
    return `${MONTH_NAMES[m]}/${y}`
  })

  return `${labels[0]} — ${labels[2]}`
}

function getCurrentQuarterIndex(month: number): number {
  if (month >= 9 && month <= 11) return 0
  if (month === 12 || month <= 2) return 1
  if (month >= 3 && month <= 5) return 2
  return 3
}

function getFutureQuarters(): Array<{ value: string; year: number; label: string }> {
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const curIdx = getCurrentQuarterIndex(currentMonth)

  let yr = currentYear
  if (curIdx === 1 && currentMonth <= 2) {
    yr = currentYear - 1
  }

  const results: Array<{ value: string; year: number; label: string }> = []
  let idx = curIdx

  for (let i = 0; i < 4; i++) {
    const quarter = QUARTER_ORDER[idx]
    results.push({
      value: quarter,
      year: yr,
      label: formatQuarterLabel(quarter, yr),
    })
    const nextIdx = (idx + 1) % 4
    if (idx === 1 && nextIdx === 2) {
      yr++
    }
    idx = nextIdx
  }

  return results
}

const yyyyMmDd = (d: Date) => d.toISOString().split("T")[0]

const formSchema = z.object({
  fee_id: z.number().min(1, "Please select a fee"),
  quarterKey: z.string().min(1, "Please select a quarter"),
  due_date: z.date({ required_error: "Due date is required" }),
})

type FormValues = z.infer<typeof formSchema>

interface GenerateInvoicesModalProps {
  onSuccess?: () => void
}

export function GenerateInvoicesModal({ onSuccess }: GenerateInvoicesModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [activeRecurringFees, setActiveRecurringFees] = useState<Fee[]>([])
  const [isLoadingFees, setIsLoadingFees] = useState(false)

  const futureQuarters = useMemo(() => getFutureQuarters(), [])

  useEffect(() => {
    if (!open) return
    let mounted = true
    setIsLoadingFees(true)
    fetchAllFees("monthly", "active")
      .then((fees) => {
        const recurring = fees.filter((f) => f.is_recurring === true)
        if (mounted) setActiveRecurringFees(recurring)
      })
      .catch(() => {
        if (mounted) toast.error("Failed to load fees")
      })
      .finally(() => {
        if (mounted) setIsLoadingFees(false)
      })
    return () => {
      mounted = false
    }
  }, [open])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fee_id: 0,
      quarterKey: "",
      due_date: undefined,
    },
  })

  const selectedQuarterKey = form.watch("quarterKey")
  const selectedDueDate = form.watch("due_date")

  const selectedQuarter = useMemo(
    () => futureQuarters.find((q) => `${q.value}|${q.year}` === selectedQuarterKey),
    [selectedQuarterKey, futureQuarters]
  )

  const resetAll = () => {
    form.reset({ fee_id: 0, quarterKey: "", due_date: undefined })
  }

  async function onSubmit(values: FormValues) {
    const match = futureQuarters.find(
      (q) => `${q.value}|${q.year}` === values.quarterKey
    )
    if (!match) return

    setIsSubmitting(true)
    try {
      const res = await generateInvoices({
        fee_id: values.fee_id,
        quarter: match.value,
        year: match.year,
        due_date: yyyyMmDd(values.due_date),
      })
      toast.success(res.message)
      setOpen(false)
      resetAll()
      onSuccess?.()
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
        toast.error(err.data?.message || "Failed to generate invoices.")
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
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Generate Invoices
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Generate Quarterly Invoices</DialogTitle>
          <DialogDescription>
            Select an active recurring fee, then choose the quarter and due date.
            One invoice per unit will be generated for the selected fee.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="fee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Fee <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select
                    value={field.value && field.value > 0 ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                    disabled={isLoadingFees}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingFees
                              ? "Loading fees..."
                              : activeRecurringFees.length === 0
                                ? "No active recurring fees"
                                : "Select a fee"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeRecurringFees.map((fee) => (
                        <SelectItem
                          key={String(fee.id)}
                          value={String(fee.id)}
                        >
                          {fee.name} — {Number(fee.amount).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quarterKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Quarter <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid gap-2"
                    >
                      {futureQuarters.map((opt) => {
                        const key = `${opt.value}|${opt.year}`
                        return (
                          <Label
                            key={key}
                            htmlFor={`q-${key}`}
                            className={cn(
                              "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/50",
                              field.value === key
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            )}
                          >
                            <RadioGroupItem value={key} id={`q-${key}`} />
                            <span className="text-sm font-medium">{opt.label}</span>
                          </Label>
                        )
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Due Date <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Select due date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setCalendarOpen(false)
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedQuarter && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                Invoices will be generated for{" "}
                <span className="font-medium text-foreground">
                  {selectedQuarter.label}
                </span>
                {form.watch("fee_id") && activeRecurringFees.length > 0 && (
                  <>
                    {" "}
                    using fee{" "}
                    <span className="font-medium text-foreground">
                      {activeRecurringFees.find((f) => Number(f.id) === form.watch("fee_id"))?.name ?? "—"}
                    </span>
                  </>
                )}
                {selectedDueDate && (
                  <>
                    {" "}with due date{" "}
                    <span className="font-medium text-foreground">
                      {format(selectedDueDate, "PPP")}
                    </span>
                  </>
                )}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  !selectedQuarterKey ||
                  !form.watch("fee_id") ||
                  activeRecurringFees.length === 0
                }
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Invoices
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
