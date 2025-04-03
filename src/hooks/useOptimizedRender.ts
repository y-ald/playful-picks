
import { useRef, useCallback, useMemo, useState, useEffect } from 'react';

/**
 * Custom hook to track if a component should re-render based on dependency changes
 * @param dependencies - Array of dependencies to track
 * @returns Object with shouldRender boolean and resetRender function
 */
export function useOptimizedRender<T>(dependencies: T[]) {
  const prevDeps = useRef<T[]>(dependencies);
  const [forceRender, setForceRender] = useState(false);

  // Check if dependencies have changed
  const depsChanged = useMemo(() => {
    if (dependencies.length !== prevDeps.current.length) return true;
    
    return dependencies.some((dep, index) => {
      return dep !== prevDeps.current[index];
    });
  }, [dependencies]);

  // Update previous dependencies if they've changed
  useEffect(() => {
    if (depsChanged || forceRender) {
      prevDeps.current = dependencies;
      if (forceRender) setForceRender(false);
    }
  }, [dependencies, depsChanged, forceRender]);

  // Function to force a re-render regardless of dependencies
  const resetRender = useCallback(() => {
    setForceRender(true);
  }, []);

  return {
    shouldRender: depsChanged || forceRender,
    resetRender
  };
}

/**
 * Custom hook to memoize expensive calculations
 * @param callback - Function to memoize
 * @param dependencies - Array of dependencies
 * @returns Memoized value
 */
export function useDeepMemo<T>(callback: () => T, dependencies: any[]) {
  const { shouldRender } = useOptimizedRender(dependencies);
  const cachedValue = useRef<T>(callback());
  
  if (shouldRender) {
    cachedValue.current = callback();
  }
  
  return cachedValue.current;
}

/**
 * Custom hook for stable callbacks
 * @param callback - Function to stabilize
 * @param dependencies - Array of dependencies
 * @returns Stable callback function
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: any[]
) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, dependencies);
}
