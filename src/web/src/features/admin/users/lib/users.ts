import api from "@/lib/api";
import type { User } from "@/types/user";

export async function fetchUsers(
  page: string,
  perPage: string,
  search: string = ""
): Promise<User[]> {
  const query = new URLSearchParams({
    page,
    per_page: perPage,
  });

  if (search) query.append("search", search);
  const response =  await api.get<User[]>(`/v1/users?${query.toString()}`);
  return response.data;
}
