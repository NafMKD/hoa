interface LeaseFormProps {
    data: any;
    setData: (data: any) => void;
  }
  
  export default function LeaseForm({ data, setData }: LeaseFormProps) {
    return (
      <div className="space-y-2">
        <select
          className="input input-bordered w-full"
          value={data?.agreement_type || ""}
          onChange={(e) => setData({ ...data, agreement_type: e.target.value })}
        >
          <option value="">Select Agreement Type</option>
          <option value="owner">Owner</option>
          <option value="representative">Representative</option>
        </select>
        <input
          type="number"
          placeholder="Agreement Amount"
          value={data?.agreement_amount || ""}
          onChange={(e) => setData({ ...data, agreement_amount: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="date"
          placeholder="Lease Start Date"
          value={data?.lease_start_date || ""}
          onChange={(e) => setData({ ...data, lease_start_date: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="date"
          placeholder="Lease End Date"
          value={data?.lease_end_date || ""}
          onChange={(e) => setData({ ...data, lease_end_date: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          placeholder="Witness 1 Full Name"
          value={data?.witness_1_full_name || ""}
          onChange={(e) => setData({ ...data, witness_1_full_name: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          placeholder="Witness 2 Full Name"
          value={data?.witness_2_full_name || ""}
          onChange={(e) => setData({ ...data, witness_2_full_name: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          placeholder="Witness 3 Full Name"
          value={data?.witness_3_full_name || ""}
          onChange={(e) => setData({ ...data, witness_3_full_name: e.target.value })}
          className="input input-bordered w-full"
        />
        <textarea
          placeholder="Notes"
          value={data?.notes || ""}
          onChange={(e) => setData({ ...data, notes: e.target.value })}
          className="textarea textarea-bordered w-full"
        />
        <input
          type="file"
          onChange={(e) => setData({ ...data, representative_document: e.target.files?.[0] })}
        />
      </div>
    );
  }
  