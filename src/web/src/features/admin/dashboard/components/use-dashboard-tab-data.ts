import { useCallback } from "react";
import {
  useQuery,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { apiErrorMessage } from "../lib/dashboard";

export function useDashboardTabData<
  TQueryFnData,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const query = useQuery(options);

  const reload = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    error: query.error ? apiErrorMessage(query.error) : null,
    reload,
  };
}
