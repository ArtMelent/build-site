import { Marked } from 'marked';

/**
 * Markdown for service descriptions (services.json → "body"). Raw HTML is shown as text
 * and only http(s), tel:, mailto: and relative links are kept; Angular's [innerHTML]
 * sanitizer adds a second layer.
 */
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const SAFE_URL = /^(https?:|tel:|mailto:|\/|#|[a-z0-9-]+(\/|$))/i;

const md = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    html({ text }) {
      return escape(text);
    },
    link({ href, text, tokens }) {
      const label = this.parser.parseInline(tokens) || escape(text);
      if (!SAFE_URL.test(href)) return label;
      const external = /^https?:/i.test(href);
      return `<a href="${escape(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    },
    image({ href, text }) {
      if (!SAFE_URL.test(href)) return '';
      return `<img src="${escape(href)}" alt="${escape(text)}" loading="lazy">`;
    },
  },
});

export function renderMarkdown(source: string): string {
  return md.parse(source ?? '', { async: false }) as string;
}
