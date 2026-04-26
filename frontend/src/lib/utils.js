import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeRichTextForEditor(value = '') {
  const source = String(value || '').trim();
  if (!source) return '';

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(source) || /&lt;\/?[a-z][\s\S]*&gt;/i.test(source);
  if (looksLikeHtml) return source;

  const blocks = source
    .split(/\n\s*\n/)
    .map(block => block.trim())
    .filter(Boolean);

  if (!blocks.length) return '';

  return blocks.map(block => {
    const lines = block
      .split('\n')
      .map(line => escapeHtml(line.trim()))
      .filter(Boolean);
    return `<p>${lines.join('<br>')}</p>`;
  }).join('');
}

function regexFallbackRichTextToPlainText(value = '') {
  return String(value)
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|section|article|blockquote|h[1-6])>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function richTextToPlainText(value = '') {
  const source = String(value || '');
  if (!source.trim()) return '';

  if (typeof window === 'undefined' || !window.document) {
    return regexFallbackRichTextToPlainText(source);
  }

  try {
    const entityDecoder = window.document.createElement('textarea');
    entityDecoder.innerHTML = source;
    const decoded = entityDecoder.value || source;

    const parser = new window.DOMParser();
    const doc = parser.parseFromString(decoded, 'text/html');
    const root = doc.body;

    root.querySelectorAll('br').forEach((node) => node.replaceWith(doc.createTextNode('\n')));
    root.querySelectorAll('li').forEach((node) => {
      node.insertBefore(doc.createTextNode('• '), node.firstChild);
      node.appendChild(doc.createTextNode('\n'));
    });
    root.querySelectorAll('p, div, section, article, blockquote, h1, h2, h3, h4, h5, h6').forEach((node) => {
      node.appendChild(doc.createTextNode('\n\n'));
    });

    return (root.textContent || '')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  } catch {
    return regexFallbackRichTextToPlainText(source);
  }
}
