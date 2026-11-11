// Sends email through Brevo's web API (BREVO_API_KEY) or Resend's web API (RESEND_API_KEY). Without either, messages are not sent;
// outside production the text is printed to the console. There is deliberately no SMTP route: it needed the nodemailer package,
// which has open security advisories, and hosts such as Render's free plan block SMTP anyway.
export function createMailer(config, fetchImpl = fetch) {
  return {
    configured: Boolean(config.mail.resendKey || config.mail.brevoKey),
    async send({to, subject, text, replyTo}) {
      if (config.mail.brevoKey) {
        // MAIL_FROM looks like: SURGICISS LTD <surgiciss@gmail.com>
        const match = String(config.mail.from).match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
        const sender = match ? {name: match[1].replace(/^"|"$/g, "") || "SURGICISS LTD", email: match[2]} : {name: "SURGICISS LTD", email: String(config.mail.from).trim()};
        const response = await fetchImpl("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          signal: AbortSignal.timeout(10000),
          headers: {"api-key": config.mail.brevoKey, "Content-Type": "application/json", Accept: "application/json"},
          body: JSON.stringify({sender, to: [{email: to}], subject, textContent: text, ...(replyTo ? {replyTo: {email: replyTo}} : {})})
        });
        if (!response.ok) {
          const detail = (await response.text().catch(() => "")).slice(0, 300);
          throw new Error(`Email service answered ${response.status} ${detail}`.trim());
        }
        return true;
      }
      if (config.mail.resendKey) {
        const response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(10000),
          headers: {Authorization: `Bearer ${config.mail.resendKey}`, "Content-Type": "application/json"},
          body: JSON.stringify({from: config.mail.from, to: [to], subject, text, ...(replyTo ? {reply_to: replyTo} : {})})
        });
        if (!response.ok) {
          const detail = (await response.text().catch(() => "")).slice(0, 300);
          throw new Error(`Email service answered ${response.status} ${detail}`.trim());
        }
        return true;
      }
      if (config.production) console.warn(`[mail] No email service is configured; message "${subject}" was not sent.`);
      else console.log(`[mail] To: ${to}\n[mail] Subject: ${subject}\n${text}\n`);
      return false;
    }
  };
}
