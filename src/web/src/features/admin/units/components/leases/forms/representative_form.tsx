interface RepresentativeFormProps {
    data: any;
    setData: (data: any) => void;
  }
  
  export default function RepresentativeForm({ data, setData }: RepresentativeFormProps) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          placeholder="First Name"
          value={data?.first_name || ""}
          onChange={(e) => setData({ ...data, first_name: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={data?.last_name || ""}
          onChange={(e) => setData({ ...data, last_name: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          placeholder="Phone"
          value={data?.phone || ""}
          onChange={(e) => setData({ ...data, phone: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="file"
          onChange={(e) => setData({ ...data, id_file: e.target.files?.[0] })}
        />
      </div>
    );
  }
  