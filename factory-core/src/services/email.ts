export interface EmailConfig {
  apiKey: string;
  from: string;
  verificationBaseUrl: string;
}

export class EmailService {
  constructor(private config: EmailConfig) {}

  /**
   * Sends a Double Opt-In verification email to a lead.
   * Uses Resend API via native fetch.
   */
  async sendVerificationEmail(to: string, token: string, projectName: string) {
    const verificationUrl = `${this.config.verificationBaseUrl}?token=${token}`;
    
    const body = {
      from: this.config.from,
      to: [to],
      subject: `Verifica la tua richiesta per ${projectName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #333;">Verifica la tua email</h1>
          <p>Grazie per aver espresso interesse per <strong>${projectName}</strong>.</p>
          <p>Per confermare la tua richiesta e ricevere maggiori informazioni, clicca sul pulsante qui sotto:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Conferma la mia richiesta</a>
          </div>
          <p style="color: #666; font-size: 14px;">Oppure copia e incolla questo link nel tuo browser:</p>
          <p style="color: #666; font-size: 14px; word-break: break-all;"><a href="${verificationUrl}">${verificationUrl}</a></p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Se non hai richiesto tu questa verifica, puoi ignorare questa email.</p>
        </div>
      `,
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${response.status} ${error}`);
    }

    return await response.json();
  }
}
