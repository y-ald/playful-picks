
import { useQuery, QueryKey, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useMemo } from 'react';

/**
 * A custom hook that optimizes data fetching with React Query
 * 
 * @param queryKey - Unique key for the query
 * @param queryFn - Function that fetches the data
 * @param options - Additional React Query options
 * @returns UseQueryResult with data and status information
 */
export function useOptimizedQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'queryKey' | 'queryFn'>
): UseQueryResult<TData, TError> {
  
  // Memoize the query key to prevent unnecessary re-renders
  const memoizedQueryKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);
  
  return useQuery({
    queryKey: memoizedQueryKey,
    queryFn,
    // Performance optimizations
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    ...options
  });
}
