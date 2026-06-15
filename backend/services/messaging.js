// Outbound messaging (SMS / WhatsApp) via Twilio's REST API.
//
// Configure with environment variables:
//   TWILIO_ACCOUNT_SID   - Twilio account SID
//   TWILIO_AUTH_TOKEN    - Twilio auth token
//   TWILIO_SMS_FROM      - sender number for SMS, e.g. +14155550123
//   TWILIO_WHATSAPP_FROM - sender for WhatsApp, e.g. +14155238886
//
// When credentials are absent the call is logged and returned with
// `simulated: true` so the app stays functional in dev without a gateway.

function normalizeNumber(n) {
  return String(n || "").replace(/[^\d+]/g, "");
}

function isConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

async function sendViaTwilio({ to, body, channel }) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const isWhatsApp = channel === "whatsapp";
  const fromRaw = isWhatsApp ? process.env.TWILIO_WHATSAPP_FROM : process.env.TWILIO_SMS_FROM;
  if (!fromRaw) {
    throw new Error(`No ${isWhatsApp ? "TWILIO_WHATSAPP_FROM" : "TWILIO_SMS_FROM"} configured`);
  }

  const fmt = (n) => (isWhatsApp ? `whatsapp:${normalizeNumber(n)}` : normalizeNumber(n));
  const params = new URLSearchParams({ To: fmt(to), From: fmt(fromRaw), Body: body });

  const resp = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.message || `Twilio error ${resp.status}`);
  }
  return { sid: data.sid, status: data.status };
}

// Send a message. Returns { success, simulated, sid, status }.
async function sendMessage({ to, message, channel = "sms" }) {
  if (!to || !message) {
    throw new Error("Both 'to' and 'message' are required");
  }
  const ch = channel === "whatsapp" ? "whatsapp" : "sms";

  if (!isConfigured()) {
    console.log(`[messaging:simulated] ${ch} -> ${to}: ${message}`);
    return {
      success: true,
      simulated: true,
      channel: ch,
      to,
      sid: `SIM-${Date.now()}`,
      status: "queued (simulated — set TWILIO_* env vars to send for real)",
    };
  }

  const result = await sendViaTwilio({ to, body: message, channel: ch });
  return { success: true, simulated: false, channel: ch, to, ...result };
}

module.exports = { sendMessage, isConfigured };
