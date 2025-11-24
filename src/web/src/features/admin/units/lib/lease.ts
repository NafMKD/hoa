export async function fetchRenters(): Promise<
  Array<{ id: number; first_name: string; last_name: string; phone?: string }>
> {
  // TODO: replace with real API
  await new Promise((r) => setTimeout(r, 50));
  return [
    { id: 101, first_name: "Alem", last_name: "Bekele", phone: "0912345678" },
    { id: 102, first_name: "Martha", last_name: "Yared", phone: "0911111111" },
  ];
}

export async function submitLease(
  formData: FormData
): Promise<{ pdf_url?: string; lease_id?: number }> {
  // TODO: replace with real POST to backend
  // Example:
  // const res = await fetch("/api/admin/leases", { method: "POST", body: formData });
  // return await res.json();
  console.log("Submitting lease with formData:", formData);
  
  await new Promise((r) => setTimeout(r, 1200));
  return { pdf_url: "/dummy/lease.pdf", lease_id: 555 };
}
