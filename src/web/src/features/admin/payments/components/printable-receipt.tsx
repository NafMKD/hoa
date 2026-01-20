import type { Payment } from "@/types/types";
import { forwardRef } from "react";

interface PrintableReceiptProps {
  payment: Payment;
}

export const PrintableReceipt = forwardRef<HTMLDivElement, PrintableReceiptProps>(
  ({ payment }, ref) => {
    const amount = Number(payment.amount);
    // Calculate balance only if invoice data is present
    const invoiceTotal = payment.invoice ? Number(payment.invoice.total_amount) : 0;
    const invoiceBalance = payment.invoice ? Number(payment.invoice.final_amount_due) : 0;
    const invoicePenalties = payment.invoice ? Number(payment.invoice.penalty_amount) : 0;

    return (
      <div ref={ref} className="hidden print:block bg-white text-black p-10 font-sans max-w-[210mm] mx-auto h-full">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
            <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight uppercase">Official Receipt</h1>
                <p className="text-sm font-semibold text-gray-500">Ref: {payment.reference}</p>
                { payment.receipt_number && (<p className="text-sm font-semibold text-gray-500">Receipt Number: {payment.receipt_number}</p>) }
                <div className="pt-2">
                     <span className={`text-xs px-2 py-0.5 border rounded uppercase font-bold ${payment.status === 'confirmed' || payment.status === 'completed' ? 'border-black text-black' : 'border-gray-300 text-gray-400'}`}>
                        {payment.status}
                     </span>
                </div>
            </div>
            <div className="text-right">
                {/* Company Details (Matches Invoice) */}
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
            {/* Column 1: Payer */}
            <div className="w-1/3">
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Received From</h3>
                <p className="font-bold text-lg">{payment.invoice?.user?.full_name || "Unknown User"}</p>
                <p className="text-sm text-gray-600">{payment.invoice?.user?.email}</p>
                <p className="text-sm text-gray-600">{payment.invoice?.user?.phone}</p>
            </div>
            
            {/* Column 2: Payment Details */}
            <div className="w-1/3 text-center">
                <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Payment Info</h3>
                <p className="font-bold capitalize">{payment.method.replace(/_/g, " ")}</p>
                <p className="text-sm text-gray-600">
                    Paid: {new Date(payment.payment_date as string).toLocaleDateString()}
                </p>
                {payment.processed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                        Processed: {new Date(payment.processed_at).toLocaleDateString()}
                    </p>
                )}
            </div>

            {/* Column 3: Applied To (Invoice Context) */}
            <div className="w-1/3 text-right">
                <div className="mb-2">
                    <span className="text-xs font-bold uppercase text-gray-400 block">Applied To Invoice</span>
                    <span className="text-sm font-medium">#{payment.invoice?.invoice_number || "N/A"}</span>
                </div>
                <div>
                    <span className="text-xs font-bold uppercase text-gray-400 block">Property Unit</span>
                    <span className="text-sm font-medium">{payment.invoice?.unit?.name || "—"}</span>
                </div>
            </div>
        </div>

        {/* ITEMS TABLE (Single Item for the Payment) */}
        <div className="mb-8">
            <table className="w-full">
                <thead>
                    <tr className="border-b-2 border-black">
                        <th className="text-left py-2 text-xs font-bold uppercase tracking-wider">Description</th>
                        <th className="text-right py-2 text-xs font-bold uppercase tracking-wider">Reference ID</th>
                        <th className="text-right py-2 text-xs font-bold uppercase tracking-wider">Amount</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    <tr className="border-b border-gray-200">
                        <td className="py-4 text-gray-700">
                            Payment towards Invoice #{payment.invoice?.invoice_number}
                            {payment.invoice?.unit?.building?.name && (
                                <div className="text-xs text-gray-500 mt-0.5">
                                    {payment.invoice.unit.building.name} - {payment.invoice.unit.name}
                                </div>
                            )}
                        </td>
                        <td className="py-4 text-right font-mono text-gray-700">{payment.reference}</td>
                        <td className="py-4 text-right font-medium text-lg">{amount.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        {/* TOTALS */}
        <div className="flex justify-end mb-12">
            <div className="w-1/2">
                <div className="flex justify-between py-3 border-b-2 border-black">
                    <span className="text-lg font-bold uppercase tracking-tight">Total Received</span>
                    <span className="text-lg font-bold">{amount.toLocaleString()} ETB</span>
                </div>
                
                {/* Optional: Show remaining balance context */}
                {payment.invoice && (
                    <div className="mt-4 pt-2 border-t border-gray-100">
                         <div className="flex justify-between py-1">
                            <span className="text-xs font-medium text-gray-500">Original Invoice Total</span>
                            <span className="text-xs font-medium text-gray-500">{invoiceTotal.toLocaleString()} ETB</span>
                        </div>
                        {payment.invoice?.penalty_amount !== 0 && (
                            <div className="flex justify-between py-1">
                                <span className="text-xs font-medium text-gray-500">Penalty Amount</span>
                                <span className="text-xs font-medium text-gray-500">{invoicePenalties.toLocaleString()} ETB</span>
                            </div>
                        )}
                        <div className="flex justify-between py-1">
                            <span className="text-xs font-medium text-gray-500">Remaining Balance Due</span>
                            <span className="text-xs font-bold text-gray-700">{invoiceBalance.toLocaleString()} ETB</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* FOOTER */}
        <div className="fixed bottom-10 left-10 right-10 border-t pt-4">
             <div className="flex justify-between items-end">
                <div>
                    <h4 className="text-xs font-bold uppercase text-gray-400 mb-1">Declaration</h4>
                    <p className="text-sm text-gray-600 italic">
                        This is a computer-generated receipt and requires no signature.
                    </p>
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

PrintableReceipt.displayName = "PrintableReceipt";