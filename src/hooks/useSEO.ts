import { useEffect } from 'react';

const DEFAULT_TITLE = "ABR Gadgets - Pakistan's No.1 Creator Store";
const DEFAULT_DESCRIPTION =
  'ABR Gadgets - Gear Up Your Creativity. Premium quality gear for content creators, all over Pakistan.';
const DEFAULT_IMAGE = '/images/logo/abr-gadgets.png';

interface SEOOptions {
  /** Page-specific title. Keep it under ~60 characters where possible. */
  title: string;
  /** Page-specific description. Keep it under ~155 characters where possible. */
  description: string;
  image?: string;
  /** Optional structured data (e.g. a Product schema) rendered as a <script type="application/ld+json"> */
  jsonLd?: Record<string, unknown>;
}

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Updates document.title, meta description/OG tags, and (optionally) injects
 * a JSON-LD structured data script for the current page. Resets to the
 * site-wide defaults on unmount so navigating away doesn't leave stale tags
 * behind (important since this is a client-side routed SPA with no real
 * per-URL server response).
 */
export function useSEO({ title, description, image, jsonLd }: SEOOptions) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image || DEFAULT_IMAGE);

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = jsonLdKey;
      script.dataset.pageSeo = 'true';
      document.head.appendChild(script);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag('name', 'description', DEFAULT_DESCRIPTION);
      setMetaTag('property', 'og:title', DEFAULT_TITLE);
      setMetaTag('property', 'og:description', DEFAULT_DESCRIPTION);
      setMetaTag('property', 'og:image', DEFAULT_IMAGE);
      if (script) script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image, jsonLdKey]);
}
