import { useState, useEffect, useCallback } from 'react';

interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

interface UseGeolocationReturn {
  position: GeoPosition | null;
  error: string | null;
  loading: boolean;
  refresh: () => void;
}

/**
 * Hook: Browser Geolocation.
 * Requests user's GPS coordinates on mount.
 * Returns { position, error, loading, refresh }.
 */
export function useGeolocation(autoStart = true): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Location access denied'
            : err.code === 2
            ? 'Position unavailable'
            : 'Location request timed out'
        );
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (autoStart) requestPosition();
  }, [autoStart, requestPosition]);

  return { position, error, loading, refresh: requestPosition };
}
