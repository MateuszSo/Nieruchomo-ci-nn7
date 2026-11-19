const nodemailer = require('nodemailer');

/**
 * Wysyła powiadomienie e-mail o nowym zapytaniu ze strony (jeśli skonfigurowano SMTP w .env)
 */
async function sendContactEmail({ name, email, phone, subject, message, propertyTitle }, settings, agentEmail = null) {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return { sent: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || 'true') === 'true',
      auth: { user, pass }
    });

    const defaultReceiver = process.env.CONTACT_RECEIVER_EMAIL || user;
    const receiver = agentEmail || defaultReceiver;
    const mailSubject = propertyTitle
      ? `Zapytanie o ofertę: ${propertyTitle} (od ${name})`
      : `Nowa wiadomość ze strony: ${subject || 'Formularz kontaktowy'} (od ${name})`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Strona Nieruchomości" <${user}>`,
      to: receiver,
      replyTo: email || undefined,
      subject: mailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #d7e1f0; border-radius: 8px;">
          <h2 style="color: #223c66; margin-top: 0;">Nowe zapytanie ze strony internetowej</h2>
          ${propertyTitle ? `<p style="background: #f5f7fb; padding: 10px 14px; border-left: 4px solid #caa23e;"><strong>Dotyczy nieruchomości:</strong> ${propertyTitle}</p>` : ''}
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 6px 0; color: #5b7396; width: 140px;">Imię i nazwisko:</td><td style="padding: 6px 0; font-weight: bold; color: #223c66;">${name}</td></tr>
            <tr><td style="padding: 6px 0; color: #5b7396;">Telefon:</td><td style="padding: 6px 0; font-weight: bold; color: #223c66;">${phone || 'Nie podano'}</td></tr>
            <tr><td style="padding: 6px 0; color: #5b7396;">E-mail:</td><td style="padding: 6px 0;">${email || 'Nie podano'}</td></tr>
            <tr><td style="padding: 6px 0; color: #5b7396;">Temat:</td><td style="padding: 6px 0;">${subject || 'Zapytanie ogólne'}</td></tr>
          </table>
          <div style="background: #f5f7fb; padding: 16px; border-radius: 6px; margin-top: 12px; white-space: pre-wrap;">${message}</div>
        </div>
      `
    });

    return { sent: true };
  } catch (err) {
    console.error('[Mailer Error]:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = {
  sendContactEmail
};
