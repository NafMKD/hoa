import type { Invoice } from "@/types/types";
import { forwardRef } from "react";

interface PrintableInvoiceProps {
  invoice: Invoice;
}

export const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ invoice }, ref) => {
    const totalAmount = Number(invoice.total_amount);
    const paidAmount = Number(invoice.amount_paid);
    const balanceDue = Number(invoice.final_amount_due);

    return (
      <div ref={ref} className="hidden print:block bg-white text-black p-10 font-sans max-w-[210mm] mx-auto h-full">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight uppercase">Invoice</h1>
                <p className="text-sm font-semibold text-gray-500">#{invoice.invoice_number}</p>
            </div>
            <div className="text-right">
                {/* Replace with your Company Logo/Name */}
                <h2 className="text-xl font-bold text-gray-800">Noah Figa Garden Homeowners L.C.A.</h2>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    <p>Figa</p>
                    <p>Addis Ababa, Ethiopia</p>
                    <p>+251 911 000 000</p>
                </div>
            </div>
        </div>

        {/* INFO GRID */}
        <div className="flex justify-between mb-10">
            <div className="w-1/3">
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Bill To</h3>
                <p className="font-bold text-lg">{invoice.user?.full_name}</p>
                <p className="text-sm text-gray-600">{invoice.user?.email}</p>
                <p className="text-sm text-gray-600">{invoice.user?.phone}</p>
            </div>
            
            <div className="w-1/3 text-center">
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Property</h3>
                <p className="font-bold">{invoice.unit?.name}</p>
                <p className="text-sm text-gray-600">{invoice.unit?.building?.name}</p>
            </div>

            <div className="w-1/3 text-right">
                <div className="mb-2">
                    <span className="text-xs font-bold uppercase text-gray-400 block">Issue Date</span>
                    <span className="text-sm font-medium">{new Date(invoice.issue_date).toLocaleDateString()}</span>
                </div>
                <div>
                    <span className="text-xs font-bold uppercase text-gray-400 block">Due Date</span>
                    <span className="text-sm font-medium">{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '—'}</span>
                </div>
            </div>
        </div>

        {/* ITEMS TABLE */}
        <div className="mb-8">
            <table className="w-full">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left py-2 text-xs font-bold uppercase tracking-wider">Description</th>
                        <th className="text-right py-2 text-xs font-bold uppercase tracking-wider">Qty</th>
                        <th className="text-right py-2 text-xs font-bold uppercase tracking-wider">Price</th>
                        <th className="text-right py-2 text-xs font-bold uppercase tracking-wider">Total</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                     {/* Logic: Check Metadata items, fallback to Source */}
                     {invoice.metadata?.items ? (
                        invoice.metadata.items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                                <td className="py-3 text-gray-700">{item.description}</td>
                                <td className="py-3 text-right text-gray-700">{item.quantity}</td>
                                <td className="py-3 text-right text-gray-700">{Number(item.unit_price).toLocaleString()}</td>
                                <td className="py-3 text-right font-medium">{Number(item.total).toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr className="border-b border-gray-200">
                            <td className="py-3 text-gray-700">
                                {invoice.source?.name || "Services Rendered"}
                                {invoice.source?.description && <div className="text-xs text-gray-500">{invoice.source.description}</div>}
                            </td>
                            <td className="py-3 text-right text-gray-700">1</td>
                            <td className="py-3 text-right text-gray-700">{Number(invoice.total_amount).toLocaleString()}</td>
                            <td className="py-3 text-right font-medium">{Number(invoice.total_amount).toLocaleString()}</td>
                        </tr>
                    )}

                    { invoice.penalties && invoice.penalties.length > 0 && invoice.penalties.map((penalty) => (
                        <tr key={penalty.id} className="border-b border-gray-200">
                            <td className="py-3 text-gray-700">
                                Penalty: {penalty.reason || "No reason provided"}
                                <div className="text-xs text-gray-500">Applied on {new Date(penalty.applied_date).toLocaleDateString()}</div>
                            </td>
                            <td className="py-3 text-right text-gray-700">1</td>
                            <td className="py-3 text-right text-gray-700">{Number(penalty.amount).toLocaleString()}</td>
                            <td className="py-3 text-right font-medium">{Number(penalty.amount).toLocaleString()}</td>
                        </tr>
                    )) }

                </tbody>
            </table>
        </div>

        {/* TOTALS */}
        <div className="flex justify-end mb-12">
            <div className="w-1/2">
                <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Subtotal</span>
                    <span className="text-sm font-bold text-gray-800">{totalAmount.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Penalty</span>
                    <span className="text-sm font-bold text-red-600">+{Number(invoice.penalty_amount).toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-600">Amount Paid</span>
                    <span className="text-sm font-bold text-gray-800">-{paidAmount.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-black mt-2">
                    <span className="text-lg font-bold uppercase tracking-tight">Balance Due</span>
                    <span className="text-lg font-bold">{balanceDue.toLocaleString()} ETB</span>
                </div>
            </div>
        </div>

        {/* FOOTER */}
        <div className="fixed bottom-10 left-10 right-10 border-t pt-4">
             <div className="flex justify-between items-end">
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-1">Payment Instructions</h4>
                    <p className="text-sm text-gray-600">Bank: Commercial Bank of Ethiopia</p>
                    <p className="text-sm text-gray-600">Account: 1000623210379</p>
                    <p className="text-sm text-gray-600">Ref: {invoice.invoice_number}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 italic">Generated on {new Date().toLocaleDateString()}</p>
                    <p className="text-xs text-gray-400 font-bold mt-1">Thank you.</p>
                </div>
             </div>
        </div>

      </div>
    );
  }
);

PrintableInvoice.displayName = "PrintableInvoice";