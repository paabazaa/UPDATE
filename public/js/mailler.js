// Sends email through the Resend web API when RESEND_API_KEY is set, otherwise through SMTP when SMTP_HOST is set
// (needs the "nodemailer" package, listed in package.json). Without either, messages are not sent;
// outside production the text is printed to the console.
export function createMailer(config, fetchImpl = fetch) {
  let transport = null;
  return {
    configured: Boolean(config.mail.resendKey || config.mail.host),
    async send({to, subject, text, replyTo}) {
      if (config.mail.resendKey) {
        const response = await fetchImpl("https://api.resend.com/emails", {
          method: "POST",
          signal: AbortSignal.timeout(10000),
          headers: {Authorization: `Bearer ${config.mail.resendKey}`, "Content-Type": "application/json"},
          body: JSON.stringify({from: config.mail.from, to: [to], subject, text, ...(replyTo ? {reply_to: replyTo} : {})})
        });
        if (!response.ok) throw new Error(`Email service answered ${response.status}`);
        return true;
      }
      if (!config.mail.host) {
        if (config.production) console.warn(`[mail] No email service is configured; message "${subject}" was not sent.`);
        else console.log(`[mail] To: ${to}\n[mail] Subject: ${subject}\n${text}\n`);
        return false;
      }
      if (!transport) {
        const {default: nodemailer} = await import("nodemailer");
        transport = nodemailer.createTransport({
          host: config.mail.host,
          port: config.mail.port,
          secure: config.mail.secure,
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          auth: config.mail.user ? {user: config.mail.user, pass: config.mail.password} : undefined
        });
      }
      await transport.sendMail({from: config.mail.from, to, subject, text, ...(replyTo ? {replyTo} : {})});
      return true;
    }
  };
}
