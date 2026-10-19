// Sends email through SMTP when SMTP_HOST is set (needs the "nodemailer" package, listed in package.json).
// Without SMTP settings, messages are not sent; outside production the text is printed to the console.
export function createMailer(config) {
  let transport = null;
  return {
    configured: Boolean(config.mail.host),
    async send({to, subject, text}) {
      if (!config.mail.host) {
        if (config.production) console.warn(`[mail] SMTP is not configured; message "${subject}" was not sent.`);
        else console.log(`[mail] To: ${to}\n[mail] Subject: ${subject}\n${text}\n`);
        return false;
      }
      if (!transport) {
        const {default: nodemailer} = await import("nodemailer");
        transport = nodemailer.createTransport({
          host: config.mail.host,
          port: config.mail.port,
          secure: config.mail.secure,
          auth: config.mail.user ? {user: config.mail.user, pass: config.mail.password} : undefined
        });
      }
      await transport.sendMail({from: config.mail.from, to, subject, text});
      return true;
    }
  };
}
