import { useEffect } from 'react';

const DEFAULT_TITLE = "ABR Gadgets - Pakistan's No.1 Creator Store";
const DEFAULT_DESCRIPTION = 'ABR Gadgets - Gear Up Your Creativity. Premium quality gear for content creators, all over Pakistan.';
const DEFAULT_IMAGE = '/images/logo/abr-gadgets.png';

interface SEOOptions {
  title: string;
  description: string;
  image?: string;
  jsonLd?: Record<string, unknown>;
  canonical?: string;
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

function setCanonical(url: string | null) {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!url) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = url;
}

export function useSEO({ title, description, image, jsonLd, canonical }: SEOOptions) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    document.title = title;
    setMetaTag('name', 'description', description);
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image || DEFAULT_IMAGE);
    setMetaTag('property', 'og:url', window.location.href);
    setCanonical(canonical || null);

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
      setMetaTag('property', 'og:url', window.location.origin + '/');
      setCanonical(null);
      if (script) script.remove();
    };
  }, [title, description, image, jsonLdKey, canonical]);
}
