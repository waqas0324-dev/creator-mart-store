const ALLOWED_TAGS = new Set(['P','BR','STRONG','B','EM','I','U','H1','H2','H3','UL','OL','LI','SPAN','MARK','DIV','TABLE','THEAD','TBODY','TR','TH','TD']);

export function sanitizeRichHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html.replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi, '').replace(/on[a-z]+\\s*=\\s*(['"]).*?\\1/gi, '');
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const cleanNode = (node: Node) => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (!ALLOWED_TAGS.has(el.tagName)) {
          const parent = el.parentNode;
          if (parent) {
            while (el.firstChild) parent.insertBefore(el.firstChild, el);
            parent.removeChild(el);
          }
          return;
        }
        [...el.attributes].forEach(attr => {
          const name = attr.name.toLowerCase();
          if (name === 'style') {
            const allowed = attr.value
              .split(';')
              .map(rule => rule.trim())
              .filter(rule => /^(color|background-color|font-size|text-align|font-weight|font-style|text-decoration)\\s*:/i.test(rule))
              .join('; ');
            if (allowed) el.setAttribute('style', allowed);
            else el.removeAttribute('style');
          } else if (name !== 'class') {
            el.removeAttribute(attr.name);
          }
        });
        cleanNode(el);
      } else if (child.nodeType !== Node.TEXT_NODE) {
        child.parentNode?.removeChild(child);
      }
    });
  };
  cleanNode(doc.body);
  return doc.body.innerHTML;
}

export function plainTextFromHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return html.replace(/<[^>]+>/g, ' ');
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\\s+/g, ' ').trim();
}
