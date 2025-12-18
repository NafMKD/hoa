// src/types/api-error.ts
export interface ApiError {
  message: string;
  status?: number;
  data?: Data;
}

export interface Data {
  errors?: {
    [key: string]: string[] | string;
  };
  message?: string;
  status?: string;
}