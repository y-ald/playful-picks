import { useCallback, useEffect, useRef, useMemo } from "react";
import {
  useQueryClient,
  QueryKey,
  UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define table names type for type safety
type TableName =
  | "products"
  | "cart_items"
  | "favorites"
  | "profiles"
  | "orders"
  | "order_items"
  | "shipments"
  | "user_addresses"
  | "contact_messages";

// Type for batch request
interface BatchRequest {
  id: string;
  table: TableName;
  query: any;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

// Global batch state
const batchQueue: Map<TableName, BatchRequest[]> = new Map();
const batchTimeouts: Map<TableName, NodeJS.Timeout> = new Map();
const BATCH_DELAY = 50; // ms to wait before processing batch

// Cache for in-flight requests to prevent duplicate requests
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Generates a cache key for a request
 * @param table The table name
 * @param query The query object
 * @returns A string key
 */
function generateRequestKey(table: TableName, query: any): string {
  // Create a simplified representation of the query for the key
  const queryStr = JSON.stringify(query);
  return `${table}:${queryStr}`;
}

/**
 * Processes a batch of similar requests to the same table
 * @param table The Supabase table name
 * @param requests Array of batch requests
 */
async function processBatch(table: TableName, requests: BatchRequest[]) {
  if (requests.length === 0) return;

  try {
    // Group similar requests to reduce database load
    const requestGroups = new Map<string, BatchRequest[]>();

    // Group requests by their query signature
    requests.forEach((request) => {
      const key = generateRequestKey(table, request.query);
      if (!requestGroups.has(key)) {
        requestGroups.set(key, []);
      }
      requestGroups.get(key)!.push(request);
    });

    // Process each group of similar requests
    for (const [key, groupRequests] of requestGroups.entries()) {
      // Check if there's already an in-flight request for this query
      if (inFlightRequests.has(key)) {
        const result = await inFlightRequests.get(key);
        // Resolve all requests in this group with the cached result
        groupRequests.forEach((request) => {
          if (result.error) {
            request.reject(result.error);
          } else {
            request.resolve(result.data);
          }
        });
        continue;
      }

      // Create a new request and cache it
      const firstRequest = groupRequests[0];
      const promise = firstRequest.query;
      inFlightRequests.set(key, promise);

      try {
        const response = await promise;
        // Remove from in-flight cache after completion
        inFlightRequests.delete(key);

        // Resolve all requests in this group
        groupRequests.forEach((request) => {
          if (response.error) {
            request.reject(response.error);
          } else {
            request.resolve(response.data);
          }
        });
      } catch (error) {
        // Remove from in-flight cache on error
        inFlightRequests.delete(key);
        // Reject all requests in this group
        groupRequests.forEach((request) => request.reject(error));
      }
    }
  } catch (error) {
    console.error("Error processing batch:", error);
    // Reject all requests with the error
    requests.forEach((request) => request.reject(error));
  }
}

/**
 * Adds a request to the batch queue and schedules processing
 * @param table The Supabase table name
 * @param query The Supabase query
 * @returns Promise that resolves with the query result
 */
function batchRequest(table: TableName, query: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestId = Math.random().toString(36).substring(2, 9);
    const request: BatchRequest = {
      id: requestId,
      table,
      query,
      resolve,
      reject,
    };

    // Add to queue
    if (!batchQueue.has(table)) {
      batchQueue.set(table, []);
    }
    batchQueue.get(table)!.push(request);

    // Clear existing timeout
    if (batchTimeouts.has(table)) {
      clearTimeout(batchTimeouts.get(table)!);
    }

    // Schedule processing
    const timeout = setTimeout(() => {
      const requests = batchQueue.get(table) || [];
      batchQueue.set(table, []);
      batchTimeouts.delete(table);
      processBatch(table, requests);
    }, BATCH_DELAY);

    batchTimeouts.set(table, timeout);
  });
}

/**
 * Custom hook for optimized data fetching with React Query
 * @param queryKey Unique key for the query
 * @param table Supabase table name
 * @param queryFn Function that returns a Supabase query
 * @param options Additional React Query options
 * @returns UseQueryResult with data and status information
 */
export function useSupabaseQuery<TData = any>(
  queryKey: QueryKey,
  table: TableName,
  queryFn: () => any,
  options?: Omit<
    UseQueryOptions<TData, Error, TData, QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  const queryClient = useQueryClient();
  const queryFnRef = useRef(queryFn);
  const stableQueryKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);

  // Update the ref when queryFn changes
  useEffect(() => {
    queryFnRef.current = queryFn;
  }, [queryFn]);

  // Prefetch data when this hook is used, but only if not disabled
  useEffect(() => {
    if (options?.enabled !== false) {
      // Use a short timeout to allow multiple components to mount
      // before triggering prefetch, improving batching opportunities
      const timeoutId = setTimeout(() => {
        queryClient.prefetchQuery({
          queryKey: stableQueryKey,
          queryFn: async () => {
            const query = queryFnRef.current();
            return await batchRequest(table, query);
          },
          staleTime: options?.staleTime || 1000 * 60 * 5, // 5 minutes default
        });
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [
    stableQueryKey,
    table,
    queryClient,
    options?.enabled,
    options?.staleTime,
  ]);

  // Wrapped query function that uses batching
  const batchedQueryFn = useCallback(async () => {
    const query = queryFnRef.current();
    return await batchRequest(table, query);
  }, [table]);

  return useQuery<TData, Error, TData, QueryKey>({
    queryKey: stableQueryKey,
    queryFn: batchedQueryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
}

/**
 * Custom hook for fetching product data with optimizations
 * @param productId Product ID to fetch
 * @param options Additional React Query options
 * @returns UseQueryResult with product data
 */
export function useProductData(
  productId: string,
  options?: Omit<
    UseQueryOptions<any, Error, any, QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  return useSupabaseQuery(
    ["product", productId],
    "products",
    () => supabase.from("products").select("*").eq("id", productId).single(),
    options
  );
}

/**
 * Custom hook for fetching multiple products with optimizations
 * @param productIds Array of product IDs to fetch
 * @param options Additional React Query options
 * @returns UseQueryResult with products data
 */
export function useProductsData(
  productIds: string[],
  options?: Omit<
    UseQueryOptions<any[], Error, any[], QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  // Skip the query if no product IDs are provided
  const enabled = productIds.length > 0 && options?.enabled !== false;

  return useSupabaseQuery(
    ["products", productIds],
    "products",
    () => supabase.from("products").select("*").in("id", productIds),
    { ...options, enabled }
  );
}

/**
 * Custom hook for fetching products by category with optimizations
 * @param category Category to filter by
 * @param options Additional React Query options
 * @returns UseQueryResult with products data
 */
export function useProductsByCategory(
  category: string,
  options?: Omit<
    UseQueryOptions<any[], Error, any[], QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  // Skip the query if no category is provided
  const enabled = !!category && options?.enabled !== false;

  return useSupabaseQuery(
    ["products", "category", category],
    "products",
    () => supabase.from("products").select("*").eq("category", category),
    { ...options, enabled }
  );
}

/**
 * Custom hook for fetching cart items with product details
 * @param userId User ID to fetch cart for
 * @param options Additional React Query options
 * @returns UseQueryResult with cart items data
 */
export function useCartItemsWithProducts(
  userId: string,
  options?: Omit<
    UseQueryOptions<any[], Error, any[], QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  // Skip the query if no user ID is provided
  const enabled = !!userId && options?.enabled !== false;

  return useSupabaseQuery(
    ["cart", userId],
    "cart_items",
    () =>
      supabase
        .from("cart_items")
        .select("*, product:products(*)")
        .eq("user_id", userId),
    { ...options, enabled }
  );
}

/**
 * Custom hook for fetching favorites with product details
 * @param userId User ID to fetch favorites for
 * @param options Additional React Query options
 * @returns UseQueryResult with favorites data
 */
export function useFavoritesWithProducts(
  userId: string,
  options?: Omit<
    UseQueryOptions<any[], Error, any[], QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  // Skip the query if no user ID is provided
  const enabled = !!userId && options?.enabled !== false;

  return useSupabaseQuery(
    ["favorites", userId],
    "favorites",
    () =>
      supabase
        .from("favorites")
        .select("*, product:products(*)")
        .eq("user_id", userId),
    { ...options, enabled }
  );
}
