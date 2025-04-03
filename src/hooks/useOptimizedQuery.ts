
import { useEffect, useRef } from 'react';
import { useQuery, useMutation, QueryKey, useQueryClient } from '@tanstack/react-query';
import { useOptimizedRender } from './useOptimizedRender';

/**
 * Custom hook that extends useQuery with additional optimization features
 * 
 * @param key - The unique query key
 * @param fetchFn - The async function to fetch data
 * @param options - Additional options for the query
 * @returns The query result with additional optimization helpers
 */
export function useOptimizedQuery<TData, TError>(
  key: QueryKey,
  fetchFn: () => Promise<TData>,
  options: any = {}
) {
  const queryClient = useQueryClient();
  const previousDataRef = useRef<TData | undefined>();
  
  // Track if key dependencies have changed to optimize refetching
  const keyDeps = Array.isArray(key) ? key : [key];
  const { shouldRender } = useOptimizedRender(keyDeps);
  
  // Basic query setup with stability optimizations
  const query = useQuery({
    queryKey: key,
    queryFn: fetchFn,
    ...options,
    // Only refetch automatically if dependencies have changed
    refetchOnMount: shouldRender ? options.refetchOnMount : false,
    refetchOnWindowFocus: options.refetchOnWindowFocus || false,
    refetchOnReconnect: options.refetchOnReconnect || false,
    staleTime: options.staleTime || 1000 * 60 * 5, // 5 minutes default
  });

  // Store previous successful data
  useEffect(() => {
    if (query.data !== undefined && !query.isError) {
      previousDataRef.current = query.data;
    }
  }, [query.data, query.isError]);

  // Helper methods for data manipulation
  const optimizedHelpers = {
    // Force refetch data
    refresh: () => queryClient.invalidateQueries({ queryKey: key }),
    
    // Update data without refetching
    updateData: (updater: (oldData: TData | undefined) => TData) => {
      queryClient.setQueryData(key, (oldData: TData | undefined) => updater(oldData));
    },
    
    // Get previous data if current fetch failed
    previousData: previousDataRef.current,
    
    // Clear the query cache
    clearCache: () => queryClient.removeQueries({ queryKey: key }),
  };

  return { ...query, ...optimizedHelpers };
}

/**
 * Create an optimized mutation hook
 */
export function useOptimizedMutation<TData, TError, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: any = {}
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    ...options,
    onSuccess: async (data, variables, context) => {
      // Run custom onSuccess handler if provided
      if (options.onSuccess) {
        await options.onSuccess(data, variables, context);
      }
      
      // Invalidate queries if specified
      if (options.invalidateQueries) {
        queryClient.invalidateQueries({ 
          queryKey: options.invalidateQueries 
        });
      }
    },
  });
}
