export interface EnquiryData {
  name: string;
  email: string;
  phone?: string;
  eventDate?: string;
  message?: string;
  serviceName?: string;
  venue?: string;
  budget?: string;
  /** Which form on the site the lead came from, e.g. "Home - Side Panel". */
  source?: string;
}

const ATTRIBUTION_KEY = "elegantize_lead_attribution";
const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

interface Attribution {
  landingPage: string;
  referrer: string;
  [key: string]: string;
}

const safeStorage = {
  get(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  },
};

/**
 * Records where the visitor first arrived from (landing page, external referrer, UTM/ad click ids).
 * Stored for the session so it survives SPA navigation to the page where the form is submitted.
 */
export const captureLeadAttribution = (): Attribution => {
  const existing = safeStorage.get(ATTRIBUTION_KEY);
  const params = new URLSearchParams(window.location.search);
  const hasTracking = TRACKING_PARAMS.some((p) => params.get(p));

  if (existing && !hasTracking) {
    try {
      return JSON.parse(existing) as Attribution;
    } catch {
      /* fall through and recapture */
    }
  }

  const attribution: Attribution = {
    landingPage: window.location.href,
    referrer: document.referrer || "Direct",
  };
  TRACKING_PARAMS.forEach((p) => {
    attribution[p] = params.get(p) || "";
  });

  safeStorage.set(ATTRIBUTION_KEY, JSON.stringify(attribution));
  return attribution;
};

const getDevice = () => {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "Mobile";
  return "Desktop";
};

export const submitToGoogleSheets = async (
  data: EnquiryData,
): Promise<{ success: boolean; message?: string }> => {
  const GOOGLE_SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL;

  if (!GOOGLE_SHEET_URL) {
    console.error("Google Sheet URL is missing in environment variables.");
    return { success: false, message: "Configuration error." };
  }

  const attribution = captureLeadAttribution();

  const payload = {
    ...data,
    source: data.source || data.serviceName || "Website",
    pageUrl: window.location.href,
    pageTitle: document.title,
    device: getDevice(),
    ...attribution,
  };

  try {
    // no-cors: Apps Script's 302 redirect trips CORS in browsers; the data still arrives.
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    return { success: true };
  } catch (error) {
    console.error("Error submitting to Google Sheets:", error);
    return { success: false, message: "Network error." };
  }
};
