import { useEffect, useRef } from 'react';
import { apiClient } from '../services/api';

/**
 * Hook: UTM Campaign Tracker.
 * Captures utm_source, utm_medium, utm_campaign, utm_content, utm_term
 * from the URL on first load and sends a tracking event to the backend.
 * Also stores the session ID for conversion attribution later.
 */
export function useUtmTracker() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    const campaign = params.get('utm_campaign');
    const content = params.get('utm_content');
    const term = params.get('utm_term');

    // Only track if at least one UTM param or referrer exists
    const hasUtm = source || medium || campaign;
    const referrer = document.referrer || null;

    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('ys_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem('ys_session_id', sessionId);
    }

    if (hasUtm || referrer) {
      const deviceType = window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop';

      apiClient.post('/analytics/track-visit', {
        sessionId,
        source: source || undefined,
        medium: medium || undefined,
        campaign: campaign || undefined,
        content: content || undefined,
        term: term || undefined,
        landingPage: window.location.pathname,
        referrer: referrer || undefined,
        device: deviceType,
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome'
          : navigator.userAgent.includes('Firefox') ? 'Firefox'
          : navigator.userAgent.includes('Safari') ? 'Safari'
          : 'Other',
      }).catch(() => {
        // Silent fail — analytics should never block UX
      });
    }
  }, []);
}

/**
 * Track a conversion event (e.g. registration, listing creation).
 * Call this from registration/listing/booking success flows.
 */
export function trackConversion(conversionType: 'registered' | 'listed' | 'booked' | 'subscribed') {
  const sessionId = sessionStorage.getItem('ys_session_id');
  if (!sessionId) return;

  apiClient.post('/analytics/track-conversion', {
    sessionId,
    conversionType,
  }).catch(() => {});
}
