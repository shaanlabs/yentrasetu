import { useState, useRef, useEffect } from 'react';
import type { ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Optional skeleton background color */
  skeletonColor?: string;
  /** Intersection Observer root margin */
  rootMargin?: string;
}

/**
 * LazyImage — loads images only when they enter the viewport.
 * Shows a skeleton placeholder with fade-in animation on load.
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  skeletonColor = '#E9E3DA',
  rootMargin = '200px',
  style,
  ...rest
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    // If IntersectionObserver not supported, load immediately
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div
      ref={imgRef}
      className={`lazy-image-wrapper ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: skeletonColor,
        ...style,
      }}
    >
      {/* Skeleton shimmer */}
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(90deg, ${skeletonColor} 25%, ${skeletonColor}dd 50%, ${skeletonColor} 75%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Actual image — only rendered when in viewport */}
      {inView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={className}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.4s ease',
            ...style,
          }}
          {...rest}
        />
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
