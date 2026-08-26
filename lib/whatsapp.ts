const WHATSAPP_API_URL =
  process.env.WHATSAPP_API_URL ||
  "https://graph.facebook.com/v18.0";

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_API_TOKEN =
  process.env.WHATSAPP_API_TOKEN;

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<boolean> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_API_TOKEN) {
    console.error(
      "WhatsApp API credentials not configured."
    );
    return false;
  }

  // Normalize phone number: remove spaces, dashes, plus sign
  const normalized = to.replace(/[\s\-+()]/g, "");

  // Ensure it starts with country code (Sri Lanka: 94)
  // Strip leading 0 domestic trunk prefix when adding country code
  let phone: string;

  if (normalized.startsWith("94")) {
    phone = normalized;
  } else if (normalized.startsWith("0")) {
    phone = `94${normalized.slice(1)}`;
  } else {
    phone = `94${normalized}`;
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "text",
          text: {
            body,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `WhatsApp API error (${response.status}):`,
        errorData
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

// -----------------------------------
// Send a document (PDF) via WhatsApp
// Cloud API. Uses the "document" message
// type with a link — the API fetches
// the file from the URL directly.
// -----------------------------------

export async function sendWhatsAppDocument(
  to: string,
  mediaUrl: string,
  caption: string
): Promise<boolean> {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_API_TOKEN) {
    console.error(
      "WhatsApp API credentials not configured."
    );
    return false;
  }

  const normalized = to.replace(/[\s\-+()]/g, "");

  let phone: string;

  if (normalized.startsWith("94")) {
    phone = normalized;
  } else if (normalized.startsWith("0")) {
    phone = `94${normalized.slice(1)}`;
  } else {
    phone = `94${normalized}`;
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone,
          type: "document",
          document: {
            link: mediaUrl,
            caption,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `WhatsApp API error (${response.status}):`,
        errorData
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

export function formatNoticeWhatsAppMessage(notice: {
  title: string;
  url: string;
  publishedDate: string | null;
}): string {
  return [
    "📢 *New WUSL Notice*",
    "",
    notice.title,
    "",
    `Published: ${notice.publishedDate || "Not available"}`,
    "",
    `View: ${notice.url}`,
    "",
    "— WUSL Notice Alert",
  ].join("\n");
}

export function formatResultWhatsAppMessage(result: {
  title: string;
  url: string;
  publishedDate: string | null;
}): string {
  return [
    "🎓 *New WUSL Examination Result*",
    "",
    result.title,
    "",
    `Published: ${result.publishedDate || "Not available"}`,
    "",
    `View: ${result.url}`,
    "",
    "— WUSL Notice Alert",
  ].join("\n");
}

export function formatVenueWhatsAppMessage(venue: {
  title: string;
  url: string;
  publishedDate: string | null;
}): string {
  return [
    "🏫 *New Examination Venue Update*",
    "",
    venue.title,
    "",
    `Published: ${venue.publishedDate || "Not available"}`,
    "",
    `View: ${venue.url}`,
    "",
    "— WUSL Notice Alert",
  ].join("\n");
}
