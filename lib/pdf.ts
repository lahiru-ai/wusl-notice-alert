import * as cheerio from "cheerio";

const PDF_FETCH_TIMEOUT_MS = 10_000;

// -----------------------------------
// Find the first PDF URL on a
// WordPress post page. Scans the
// entry content for direct .pdf
// links, dFlip embeds, and
// iframes pointing to PDFs.
// Never downloads the PDF itself.
// -----------------------------------

export async function findPdfUrl(
  postUrl: string
): Promise<string | null> {
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

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Direct <a href="...pdf"> links
    let pdfUrl = findDirectPdfLinks($, postUrl);

    // 2. dFlip embeds: data-pdf attribute
    if (!pdfUrl) {
      pdfUrl = findDflipPdf($, postUrl);
    }

    // 3. Iframe embeds pointing to PDFs
    if (!pdfUrl) {
      pdfUrl = findIframePdf($, postUrl);
    }

    return pdfUrl;
  } catch {
    return null;
  }
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
// Helpers
// -----------------------------------

function findDirectPdfLinks(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string | null {
  let found: string | null = null;

  // Search within entry content first,
  // then fall back to full page
  const scopes = [
    $(".entry-content"),
    $(".elementor-widget-theme-post-content"),
    $("body"),
  ];

  for (const scope of scopes) {
    if (found) break;

    scope.find("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;

      const lower = href.toLowerCase();

      // Direct PDF link
      if (lower.endsWith(".pdf")) {
        found = new URL(href, baseUrl).href;
        return false;
      }

      // WordPress download links with
      // attachment_id param pointing to PDF
      if (
        lower.includes("/wp-content/uploads/") &&
        lower.includes(".pdf")
      ) {
        found = new URL(href, baseUrl).href;
        return false;
      }
    });
  }

  return found;
}

function findDflipPdf(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string | null {
  let found: string | null = null;

  // dFlip stores PDF URL in data-pdf
  // or data-source attribute
  $(
    "[data-pdf], [data-source], .dflip"
  ).each((_, el) => {
    if (found) return;

    const pdfAttr =
      $(el).attr("data-pdf") ||
      $(el).attr("data-source");

    if (pdfAttr) {
      found = new URL(pdfAttr, baseUrl).href;
    }
  });

  return found;
}

function findIframePdf(
  $: cheerio.CheerioAPI,
  baseUrl: string
): string | null {
  let found: string | null = null;

  $("iframe").each((_, el) => {
    if (found) return;

    const src = $(el).attr("src");
    if (src && src.toLowerCase().includes(".pdf")) {
      found = new URL(src, baseUrl).href;
    }
  });

  return found;
}
