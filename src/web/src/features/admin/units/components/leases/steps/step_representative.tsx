import RepresentativeForm from "../forms/representative_form";

interface StepRepresentativeProps {
  representativeData: any;
  setRepresentativeData: (data: any) => void;
  completeStep: () => void;
}

export default function StepRepresentative({ representativeData, setRepresentativeData, completeStep }: StepRepresentativeProps) {
  return (
    <div className="space-y-4">
      <RepresentativeForm
        data={representativeData}
        setData={setRepresentativeData}
      />
      <button className="btn btn-primary mt-2" onClick={completeStep}>
        Next
      </button>
    </div>
  );
}
