
import { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
  loadingStrategy?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  className,
  placeholderClassName,
  loadingStrategy = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Reset state when src changes
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);
  
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
          style={{ width, height }}
        />
      )}
      
      {/* The actual image */}
      <img
        src={error ? '/placeholder.svg' : src}
        alt={alt}
        width={width}
        height={height}
        loading={loadingStrategy}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          className,
          !isLoaded && "hidden" // Hide until loaded
        )}
      />
    </>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
