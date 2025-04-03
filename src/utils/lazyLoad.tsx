
import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Type for lazy-loaded components
type LazyComponentProps = {
  children?: React.ReactNode;
  [key: string]: any;
};

/**
 * Creates a lazy-loaded component with a loading fallback
 * @param importFn - Dynamic import function
 * @returns Lazy-loaded component with loading fallback
 */
export function lazyLoad(importFn: () => Promise<{ default: React.ComponentType<any> }>) {
  const LazyComponent = React.lazy(importFn);

  return function LazyLoadedComponent(props: LazyComponentProps) {
    return (
      <Suspense fallback={
        <div className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
