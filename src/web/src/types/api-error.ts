// src/types/api-error.ts
export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}
