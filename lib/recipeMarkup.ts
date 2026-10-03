// Mark up any web page as a recipe (G3, rebuild R1, 2026-10-02). Pure: no
// imports, so scripts/test_recipe_markup.js checks it.
//
// Import a Recipe reads the recipe a page describes about itself. Some
// pages never do, and some refuse a plain request or build the recipe with
// scripts after loading. For those the page opens inside the app in a web
// view, where it loads the way it would in a browser, and two things happen:
//
// 1. Once loaded, the drawn page is handed back and read with the same
//    reader as a link (extractRecipeFromHtml), so a page that only shows its
//    recipe after its scripts run is read after all.
// 2. If that still finds nothing, the person selects text on the page and
//    marks it as the name, the ingredients or the steps. The page script
//    reports each selection as it changes, so the mark buttons use what was
//    last selected even if tapping a button clears the highlight.
//
// Nothing is sent anywhere: the page is loaded from its own site, as any
// browser would, and what comes back stays on the phone until the person
// saves it through the usual import.

export type MarkField = 'title' | 'ingredients' | 'steps';

export type MarkupMessage =
  | { type: 'page'; html: string; url: string; title: string }
  | { type: 'selection'; text: string };

// The most of the drawn page handed back. A recipe page is far below this;
// the cap keeps an endless page from filling memory.
export const PAGE_HTML_CAP = 3_000_000;

// Runs in the page after it loads. Hands the drawn page back once, a little
// after loading so scripts that build the recipe have run, and then reports
// every change of selection.
export const MARKUP_PAGE_SCRIPT = `(function () {
  if (window.__insideStoryMarkup) return true;
  window.__insideStoryMarkup = true;
  function post(message) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(message)); } catch (e) {}
  }
  function sendPage() {
    var html = document.documentElement ? document.documentElement.outerHTML : '';
    post({ type: 'page', html: html.slice(0, ${PAGE_HTML_CAP}), url: String(location.href), title: String(document.title || '') });
  }
  if (document.readyState === 'complete') { setTimeout(sendPage, 1200); }
  else { window.addEventListener('load', function () { setTimeout(sendPage, 1200); }); }
  var timer = null;
  document.addEventListener('selectionchange', function () {
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () {
      var text = window.getSelection ? String(window.getSelection()) : '';
      if (text.trim()) post({ type: 'selection', text: text });
    }, 250);
  });
  return true;
})();`;

export function parseMarkupMessage(data: string): MarkupMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const m = parsed as Record<string, unknown>;
  if (m.type === 'page' && typeof m.html === 'string' && typeof m.url === 'string') {
    return { type: 'page', html: m.html, url: m.url, title: typeof m.title === 'string' ? m.title : '' };
  }
  if (m.type === 'selection' && typeof m.text === 'string' && m.text.trim()) {
    return { type: 'selection', text: m.text };
  }
  return null;
}

// Lines of selected text, tidied: blank lines dropped, bullets, numbers and
// step labels at the front taken off, inner spacing collapsed.
export function selectedLines(text: string): string[] {
  return text
    .split(/\r?\n+/)
    .map((line) =>
      line
        .replace(/^\s*(?:[-*•·▪◦‣]+|\d{1,2}[.)]|step\s*\d+[.:)]?|paso\s*\d+[.:)]?|schritt\s*\d+[.:)]?|étape\s*\d+[.:)]?)\s*/i, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter((line) => line.length > 0);
}

// A name is one line: the first non-empty one, kept short.
export function selectedTitle(text: string): string {
  return (selectedLines(text)[0] ?? '').slice(0, 160);
}

export type Marked = { title: string; ingredients: string[]; steps: string[] };

export const EMPTY_MARKED: Marked = { title: '', ingredients: [], steps: [] };

// Marking the same field again replaces what it held, so a wrong selection
// is put right by selecting again rather than by clearing anything.
export function applyMark(marked: Marked, field: MarkField, text: string): Marked {
  if (field === 'title') return { ...marked, title: selectedTitle(text) };
  if (field === 'ingredients') return { ...marked, ingredients: selectedLines(text) };
  return { ...marked, steps: selectedLines(text) };
}

export function markedSummary(marked: Marked): string {
  const parts: string[] = [];
  parts.push(marked.title ? `Name: ${marked.title}` : 'No name marked');
  parts.push(marked.ingredients.length === 1 ? '1 ingredient line' : `${marked.ingredients.length} ingredient lines`);
  parts.push(marked.steps.length === 1 ? '1 step' : `${marked.steps.length} steps`);
  return parts.join(' · ');
}

export const MARKUP_HOW_TO =
  'Press and hold on the page to select text, drag the handles to take in all of it, then press what it is. Marking the same thing again replaces it.';
