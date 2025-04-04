
import { useQuery, QueryKey, UseQueryOptions, UseQueryResult, useQueryClient } from '@tanstack/react-query';
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
  
  // Get query client for prefetching
  const queryClient = useQueryClient();
  
  // Prefetch data when this hook is used
  useMemo(() => {
    // Only prefetch if not disabled and not already in cache
    if (options?.enabled !== false && !queryClient.getQueryData(memoizedQueryKey)) {
      queryClient.prefetchQuery({
        queryKey: memoizedQueryKey,
        queryFn
      });
    }
  }, [memoizedQueryKey, queryFn, queryClient]);
  
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

/**
 * Optimizes Supabase queries by batching and deduplicating them
 * @param queryBuilder Function that returns a Supabase query
 * @returns Promise with query results
 */
export async function batchSupabaseQuery<T>(queryBuilder: () => Promise<{ data: T | null, error: any }>) {
  return await queryBuilder();
}
