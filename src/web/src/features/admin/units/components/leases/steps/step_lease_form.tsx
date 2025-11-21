import LeaseForm from "../forms/lease_form";

interface StepLeaseFormProps {
  leaseData: any;
  setLeaseData: (data: any) => void;
  completeStep: () => void;
}

export default function StepLeaseForm({ leaseData, setLeaseData, completeStep }: StepLeaseFormProps) {
  return (
    <div className="space-y-4">
      <LeaseForm
        data={leaseData}
        setData={setLeaseData}
      />
      <button className="btn btn-primary mt-2" onClick={completeStep}>
        Next
      </button>
    </div>
  );
}
