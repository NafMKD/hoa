import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from '@tanstack/react-table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Define a type for your data
export interface Payment {
  name: string
  amount: number
  date: string
  status: 'Paid' | 'Pending' | 'Failed'
}

// Create a typed column helper
const columnHelper = createColumnHelper<Payment>()

export function RecentPaymentsCard({ data }: { data: Payment[] }) {
  return (
    <Card
      className={cn(
        "rounded-2xl border-0 overflow-hidden",
        "ring-1 ring-black/5",
        // colorful surface: sky → gold → violet
        "bg-gradient-to-br from-[#E0F2FE] via-[#FFF7D6] to-[#E9D5FF]"
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-[#0B1B34]">Recent Payments</CardTitle>
        <p className="text-sm text-[#0B1B34]/60">Latest resident transactions</p>
      </CardHeader>

      <CardContent className="p-0">
        <RecentPaymentsTable data={data} />
      </CardContent>
    </Card>
  )
}

export function RecentPaymentsTable({ data }: { data: Payment[] }) {
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Resident",
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("amount", {
        header: "Amount",
        cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
      }),
      columnHelper.accessor("date", {
        header: "Date",
        cell: (info) => (
          <span className="text-[#0B1B34]/65">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const status = info.getValue()

          const colorClass =
            status === "Paid"
              ? "bg-gradient-to-r from-emerald-200 to-teal-200 text-emerald-900 ring-1 ring-emerald-400/40"
              : status === "Pending"
              ? "bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-900 ring-1 ring-amber-400/40"
              : "bg-gradient-to-r from-rose-200 to-red-200 text-rose-900 ring-1 ring-rose-400/40"

          const dotClass =
            status === "Paid"
              ? "bg-emerald-600"
              : status === "Pending"
              ? "bg-amber-600"
              : "bg-rose-600"

          return (
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
                colorClass
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", dotClass)} />
              {status}
            </span>
          )
        },
      }),
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Card className='col-span-1 lg:col-span-3'>
      <CardHeader>
        <CardTitle>Recent Payments</CardTitle>
        <CardDescription>Latest community fee collections</CardDescription>
      </CardHeader>

      <CardContent className='px-0'>
        <div className='overflow-x-auto'>
          <table className='w-full border-t text-sm'>
            <thead className='bg-muted/50 text-xs uppercase'>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className='px-4 py-3 text-left font-medium'
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className='border-b hover:bg-muted/30 transition-colors duration-150'
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className='px-4 py-2'>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
