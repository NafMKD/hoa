import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from '@tanstack/react-table'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const columnHelper = createColumnHelper()

export function RecentPaymentsTable({ data }) {
  const columns = React.useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Resident',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => <span className='font-medium'>{info.getValue()}</span>,
      }),
      columnHelper.accessor('date', {
        header: 'Date',
        cell: (info) => (
          <span className='text-muted-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue()
          const colorClass =
            status === 'Paid'
              ? 'bg-green-100 text-green-700'
              : status === 'Pending'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
          return (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                colorClass
              )}
            >
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
