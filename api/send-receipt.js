export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;
  const TG_CHAT_ID = process.env.TG_CHAT_ID;

  if (!TG_BOT_TOKEN || !TG_CHAT_ID) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { senderName, amount, ref, fileData, fileName } = req.body;

    const caption = `🧾 *Comprobante de Pago*\n\n👤 *Remitente:* ${senderName}\n💰 *Monto:* ${amount}\n🔖 *Ref:* ${ref}`;

    // Convert base64 to buffer
    const base64Data = fileData.split(',')[1] || fileData;
    const buffer = Buffer.from(base64Data, 'base64');

    // Create form data for Telegram
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('chat_id', TG_CHAT_ID);
    form.append('caption', caption);
    form.append('parse_mode', 'Markdown');
    form.append('photo', buffer, {
      filename: fileName || 'receipt.jpg',
      contentType: 'image/jpeg'
    });

    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendPhoto`;
    const response = await fetch(url, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const data = await response.json();

    if (data.ok) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(500).json({ error: 'Failed to send receipt' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}