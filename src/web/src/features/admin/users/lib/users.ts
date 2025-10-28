import api from "@/lib/api";
import type { User } from "@/types/user";

export async function fetchUsers(page: string, pageSize: string): Promise<User[]> {
  const response =  await api.get<User[]>(`/v1/users?page=${page}&per_page=${pageSize}`);
  return response.data;
}
