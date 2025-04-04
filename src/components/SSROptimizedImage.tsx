
import { useState, useEffect, memo, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SSROptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
  loadingStrategy?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * SSR-compatible optimized image component with lazy loading, placeholder, and error handling
 */
const SSROptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  className,
  placeholderClassName,
  loadingStrategy = 'lazy',
  priority = false,
  onLoad,
  onError
}: SSROptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);
  
  // Set up intersection observer for lazy loading
  useEffect(() => {
    // Skip if eager loading or priority image
    if (loadingStrategy === 'eager' || priority) {
      return;
    }

    if (!observerRef.current && imgRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            // Set the actual src attribute when in viewport
            if (img.dataset.src) {
              img.src = img.dataset.src;
            }
            // Stop observing once loaded
            observerRef.current?.unobserve(img);
          }
        });
      }, {
        rootMargin: '200px 0px', // Start loading before image is in viewport
      });
      
      observerRef.current.observe(imgRef.current);
    }
    
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [loadingStrategy, priority]);
  
  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };
  
  // Handle image error
  const handleError = () => {
    setError(true);
    onError?.();
  };

  // Use native loading attribute for browser support
  const nativeLoading = priority ? 'eager' : loadingStrategy;
  
  // Generate srcset for different screen sizes if width is provided
  const generateSrcSet = () => {
    if (!width) return undefined;
    // Only generate srcset for image formats that support it
    if (src.endsWith('.svg') || src.endsWith('.gif')) return undefined;
    
    const widths = [width, width * 1.5, width * 2];
    return widths.map(w => `${src} ${w}w`).join(', ');
  };
  
  const srcSet = generateSrcSet();
  
  return (
    <>
      {/* Show placeholder while loading */}
      {!isLoaded && !error && (
        <div 
          className={cn(
            "bg-gray-200 animate-pulse", 
            placeholderClassName,
            className
          )}
          style={{ 
            width: width ? `${width}px` : undefined, 
            height: height ? `${height}px` : undefined 
          }}
          aria-hidden="true"
        />
      )}
      
      {/* The actual image */}
      <img
        ref={imgRef}
        src={priority || loadingStrategy === 'eager' ? (error ? '/placeholder.svg' : src) : undefined}
        data-src={!priority && loadingStrategy === 'lazy' ? (error ? '/placeholder.svg' : src) : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={nativeLoading}
        srcSet={srcSet}
        sizes={width ? `(max-width: 768px) 100vw, ${width}px` : undefined}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          className,
          !isLoaded && "opacity-0", // Hide until loaded
          isLoaded && "opacity-100 transition-opacity duration-200"
        )}
        // Add fetchpriority attribute for high priority images
        fetchPriority={priority ? "high" : "auto"}
      />
    </>
  );
});

SSROptimizedImage.displayName = 'SSROptimizedImage';

export default SSROptimizedImage;
