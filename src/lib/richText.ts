const ALLOWED_TAGS = new Set(['P','BR','STRONG','B','EM','I','U','S','H2','H3','H4','UL','OL','LI','BLOCKQUOTE','SPAN','DIV','FONT']);
const ALLOWED_STYLES = new Set(['text-align','color','background-color','font-size','font-weight','text-decoration']);

export function sanitizeRichHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const clean = (node: Node) => {
    Array.from(node.childNodes).forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement;
        if (el.tagName === 'FONT' && el.hasAttribute('size')) {
          const sizeMap: Record<string, string> = { '1': '12px', '2': '14px', '3': '16px', '4': '20px', '5': '24px', '6': '28px', '7': '34px' };
          const span = doc.createElement('span');
          span.innerHTML = el.innerHTML;
          span.style.fontSize = sizeMap[el.getAttribute('size') || '3'] || '16px';
          el.replaceWith(span);
          clean(span);
          return;
        }
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
  return doc.body.innerHTML;
}
