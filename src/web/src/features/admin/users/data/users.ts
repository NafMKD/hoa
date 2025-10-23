import api from "@/lib/api"; // adjust path based on your folder structure

// Type definition for a user
export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: string;
  role: string;
  created_at: string;
  updated_at: string;
}

// Fetch all users
export async function fetchUsers(): Promise<User[]> {
  try {
    const response = await api.get("/v1/users"); // Adjust endpoint if needed
    return response.data; // assuming API returns an array of users
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw error;
  }
}

// Fetch a single user by ID
export async function fetchUserById(id: string): Promise<User> {
  try {
    const response = await api.get(`/v1/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user with id ${id}:`, error);
    throw error;
  }
}

// Optionally: create, update, and delete
export async function createUser(userData: Partial<User>) {
  const response = await api.post("/v1/users", userData);
  return response.data;
}

export async function updateUser(id: string, userData: Partial<User>) {
  const response = await api.put(`/v1/users/${id}`, userData);
  return response.data;
}

export async function deleteUser(id: string) {
  const response = await api.delete(`/v1/users/${id}`);
  return response.data;
}
