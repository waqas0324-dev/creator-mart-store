const ALLOWED_TAGS = new Set([
  'P','BR','STRONG','B','EM','I','U','S','H2','H3','H4','UL','OL','LI',
  'BLOCKQUOTE','SPAN','DIV','TABLE','THEAD','TBODY','TFOOT','TR','TH','TD'
]);
const ALLOWED_STYLES = new Set(['text-align','color','background-color','font-size','font-weight','text-decoration']);

export function sanitizeRichHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const clean = (node: Node) => {
    Array.from(node.childNodes).forEach(child => {
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
        Array.from(el.attributes).forEach(attr => {
          if (attr.name === 'style') {
            const kept = attr.value.split(';').map(rule => rule.trim()).filter(Boolean).filter(rule => {
              const name = rule.split(':')[0]?.trim().toLowerCase();
              return ALLOWED_STYLES.has(name);
            }).join('; ');
            if (kept) el.setAttribute('style', kept); else el.removeAttribute('style');
          } else {
            el.removeAttribute(attr.name);
          }
        });
      }
      clean(child);
    });
  };
  clean(doc.body);
  doc.body.querySelectorAll('h2,h3,h4').forEach(h => {
    if ((h.textContent || '').replace(/\u00a0/g, ' ').trim() === '') h.remove();
  });
  return doc.body.innerHTML;
}
