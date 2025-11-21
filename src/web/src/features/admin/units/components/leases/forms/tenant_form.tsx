interface TenantFormProps {
    tenantType: "existing" | "new" | null;
    tenantId: number | null;
    setTenantId: (id: number) => void;
    tenantData: any;
    setTenantData: (data: any) => void;
  }
  
  export default function TenantForm({ tenantType, tenantId, setTenantId, tenantData, setTenantData }: TenantFormProps) {
    if (tenantType === "existing") {
      return (
        <div>
          <label>Select Tenant</label>
          <select
            value={tenantId ?? ""}
            onChange={(e) => setTenantId(Number(e.target.value))}
            className="input input-bordered w-full"
          >
            <option value="">-- Select --</option>
          </select>
        </div>
      );
    }
  
    return (
      <div className="space-y-2">
        <input
          type="text"
          placeholder="First Name"
          value={tenantData.first_name || ""}
          onChange={(e) => setTenantData({ ...tenantData, first_name: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          placeholder="Last Name"
          value={tenantData.last_name || ""}
          onChange={(e) => setTenantData({ ...tenantData, last_name: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="text"
          placeholder="Phone"
          value={tenantData.phone || ""}
          onChange={(e) => setTenantData({ ...tenantData, phone: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="email"
          placeholder="Email"
          value={tenantData.email || ""}
          onChange={(e) => setTenantData({ ...tenantData, email: e.target.value })}
          className="input input-bordered w-full"
        />
        <input
          type="file"
          onChange={(e) => setTenantData({ ...tenantData, id_file: e.target.files?.[0] })}
        />
      </div>
    );
  }
  