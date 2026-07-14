const ALLOWED_TAGS = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'UL',
  'OL',
  'LI',
  'P',
  'BR',
  'DIV',
  'SPAN',
]);

export function isRichHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function plainTextToHtml(value: string): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

export function sanitizeRichHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') return html;

  const template = document.createElement('template');
  template.innerHTML = html;

  const walk = (node: Node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) continue;

      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.parentNode?.removeChild(child);
        continue;
      }

      const el = child as HTMLElement;
      if (!ALLOWED_TAGS.has(el.tagName)) {
        const parent = el.parentNode;
        while (el.firstChild) parent?.insertBefore(el.firstChild, el);
        parent?.removeChild(el);
        continue;
      }

      Array.from(el.attributes).forEach((attr) => {
        if (el.tagName === 'SPAN' && attr.name === 'style') {
          const fontSize = el.style.fontSize;
          el.removeAttribute('style');
          if (fontSize) el.style.fontSize = fontSize;
          return;
        }
        el.removeAttribute(attr.name);
      });

      walk(el);
    }
  };

  walk(template.content);
  return template.innerHTML;
}

export function getDisplayHtml(content: string): string {
  if (!content.trim()) return '';
  return isRichHtml(content) ? sanitizeRichHtml(content) : plainTextToHtml(content);
}
