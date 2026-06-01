import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
  noIndex?: boolean;
  schema?: Record<string, any>;
}

/**
 * Hook: Dynamic SEO Meta Tags.
 * Updates page title, meta description, OG tags, canonical URL, and JSON-LD schema
 * when the component mounts. Reverts on unmount.
 */
export function useSEO({ title, description, ogImage, canonical, noIndex, schema }: SEOProps) {
  useEffect(() => {
    const prevTitle = document.title;

    // Title
    if (title) {
      document.title = `${title} — YantraSetu`;
    }

    // Meta helpers
    function setMeta(name: string, content: string, prop?: boolean) {
      const attr = prop ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, name);
        document.head.appendChild(tag);
      }
      tag.content = content;
    }

    if (description) {
      setMeta('description', description);
      setMeta('og:description', description, true);
      setMeta('twitter:description', description);
    }

    if (title) {
      setMeta('og:title', `${title} — YantraSetu`, true);
      setMeta('twitter:title', `${title} — YantraSetu`);
    }

    if (ogImage) {
      setMeta('og:image', ogImage, true);
      setMeta('twitter:image', ogImage);
    }

    // Canonical
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // noindex
    if (noIndex) {
      setMeta('robots', 'noindex, nofollow');
    }

    // JSON-LD Schema
    let scriptTag: HTMLScriptElement | null = null;
    if (schema) {
      scriptTag = document.createElement('script');
      scriptTag.type = 'application/ld+json';
      scriptTag.text = JSON.stringify(schema);
      document.head.appendChild(scriptTag);
    }

    return () => {
      document.title = prevTitle;
      if (scriptTag) {
        document.head.removeChild(scriptTag);
      }
    };
  }, [title, description, ogImage, canonical, noIndex, schema]);
}
