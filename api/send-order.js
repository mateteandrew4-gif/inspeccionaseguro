const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const TG_CHAT_ID = process.env.TG_CHAT_ID;

  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { orderReference, clientName, email, phone, vehicle, price } = req.body;

    const message = `
🔔 *NUEVO PEDIDO - ${orderReference}*
━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Cliente:* ${clientName}
📧 *Email:* ${email}
📱 *Teléfono:* ${phone}
🚗 *Vehículo:* ${vehicle}
💰 *Total:* ${price}
━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *Responder con datos bancarios:*
Formato:
Banco: [Nombre del Banco]
IBAN: [Número IBAN]
BIC: [Código BIC/SWIFT]
Titular: [Nombre del Titular]
━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();

    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();

    if (data.ok) {
      return res.status(200).json({ success: true, orderReference });
    } else {
      return res.status(500).json({ error: 'Failed to send to Telegram', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};
