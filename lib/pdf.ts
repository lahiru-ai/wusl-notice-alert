import * as cheerio from "cheerio";

const PDF_FETCH_TIMEOUT_MS = 10_000;

// -----------------------------------
// Find ALL unique PDF URLs on a
// WordPress post page. Scans the
// entry content for direct .pdf
// links, dFlip embeds, and
// iframes pointing to PDFs.
// Never downloads the PDF itself.
// -----------------------------------

export async function findAllPdfUrls(
  postUrl: string
): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      PDF_FETCH_TIMEOUT_MS
    );

    const response = await fetch(postUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return [];

    const html = await response.text();
    const $ = cheerio.load(html);

    const urls: string[] = [
      ...findAllDirectPdfLinks($, postUrl),
      ...findAllDflipPdf($, postUrl),
      ...findAllIframePdf($, postUrl),
    ];

    const unique = [...new Set(urls)];
    return unique;
  } catch {
    return [];
  }
}

// -----------------------------------
// Convenience: return only the first
// PDF URL (or null).
// -----------------------------------

export async function findPdfUrl(
  postUrl: string
): Promise<string | null> {
  const urls = await findAllPdfUrls(postUrl);
  return urls[0] ?? null;
}

// -----------------------------------
// Fetch a PDF as a Buffer for email
// attachment. Returns null on any
// failure. Never throws.
// -----------------------------------

export async function fetchPdfBuffer(
  pdfUrl: string
): Promise<Buffer | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      PDF_FETCH_TIMEOUT_MS
    );

    const response = await fetch(pdfUrl, {
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

// -----------------------------------
// Helpers — collect all URLs
// -----------------------------------

function findAllDirectPdfLinks(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string[] {
  const found: string[] = [];

  const scopes = [
    $(".entry-content"),
    $(".elementor-widget-theme-post-content"),
    $("body"),
  ];

  for (const scope of scopes) {
    if (found.length > 0) break;

    scope.find("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      const lower = href.toLowerCase();

      if (
        lower.endsWith(".pdf") ||
        (lower.includes("/wp-content/uploads/") &&
          lower.includes(".pdf"))
      ) {
        try {
          found.push(new URL(href, baseUrl).href);
        } catch {
          // malformed URL — skip
        }
      }
    });
  }

  return found;
}

function findAllDflipPdf(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string[] {
  const found: string[] = [];

  $("[data-pdf], [data-source], .dflip").each(
    (_, el) => {
      const pdfAttr =
        $(el).attr("data-pdf") ||
        $(el).attr("data-source");

      if (pdfAttr) {
        try {
          found.push(new URL(pdfAttr, baseUrl).href);
        } catch {
          // malformed URL — skip
        }
      }
    }
  );

  return found;
}

function findAllIframePdf(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string[] {
  const found: string[] = [];

  $("iframe").each((_, el) => {
    const src = $(el).attr("src");
    if (src && src.toLowerCase().includes(".pdf")) {
      try {
        found.push(new URL(src, baseUrl).href);
      } catch {
        // malformed URL — skip
      }
    }
  });

  return found;
}
