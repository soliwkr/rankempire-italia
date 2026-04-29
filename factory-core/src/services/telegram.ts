export interface TelegramConfig {
  botToken: string;
  chatId: string;
}

export class TelegramService {
  constructor(private config: TelegramConfig) {}

  /**
   * Sends a notification message to the Telegram operator.
   */
  async sendMessage(text: string) {
    const url = `https://api.telegram.org/bot${this.config.botToken}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: this.config.chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Telegram API error: ${response.status} ${error}`);
    }

    return await response.json();
  }

  /**
   * Notifies the operator about a new verified lead.
   */
  async notifyLeadVerified(lead: { email: string; projectName: string; avatar?: string }) {
    let message = `🚀 <b>Nuovo Lead Verificato!</b>\n\n`;
    message += `📧 <b>Email:</b> ${lead.email}\n`;
    message += `🏗️ <b>Progetto:</b> ${lead.projectName}\n`;
    
    if (lead.avatar) {
      message += `👤 <b>Avatar:</b> ${lead.avatar}\n`;
    }

    return this.sendMessage(message);
  }

  /**
   * Notifies the operator that a Proof Package is ready for a project.
   */
  async notifyProofReady(project: { name: string; url: string }) {
    let message = `📦 <b>Proof Package Pronto!</b>\n\n`;
    message += `🏗️ <b>Progetto:</b> ${project.name}\n`;
    message += `🔗 <b>URL:</b> ${project.url}\n\n`;
    message += `Il primo lead è stato verificato. È ora di inviare il pacchetto di prova al cliente.`;

    return this.sendMessage(message);
  }
}
