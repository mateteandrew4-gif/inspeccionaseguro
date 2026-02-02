const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN;

  if (!TG_BOT_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { lastUpdateId, orderStartTime } = req.body;

    const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/getUpdates`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offset: lastUpdateId + 1,
        timeout: 10
      })
    });

    const data = await response.json();

    if (data.ok && data.result && data.result.length > 0) {
      let bankDetails = null;
      let newLastUpdateId = lastUpdateId;

      for (const update of data.result) {
        if (update.update_id > newLastUpdateId) {
          newLastUpdateId = update.update_id;
        }

        const msg = update.message;
        if (msg && msg.text && msg.date >= orderStartTime) {
          if (msg.text.includes('Banco:') || msg.text.includes('IBAN:') ||
              msg.text.includes('Bank:') || msg.text.includes('iban:')) {
            
            const details = {};

            const bankMatch = msg.text.match(/Banco:\s*(.+?)(?:\n|$)/i) ||
                              msg.text.match(/Bank:\s*(.+?)(?:\n|$)/i);
            if (bankMatch) details.bank = bankMatch[1].trim();

            const ibanMatch = msg.text.match(/IBAN:\s*(.+?)(?:\n|$)/i);
            if (ibanMatch) details.iban = ibanMatch[1].trim();

            const bicMatch = msg.text.match(/BIC:\s*(.+?)(?:\n|$)/i) ||
                             msg.text.match(/SWIFT:\s*(.+?)(?:\n|$)/i);
            if (bicMatch) details.bic = bicMatch[1].trim();

            const holderMatch = msg.text.match(/Titular:\s*(.+?)(?:\n|$)/i) ||
                                msg.text.match(/Holder:\s*(.+?)(?:\n|$)/i);
            if (holderMatch) details.holder = holderMatch[1].trim();

            if (details.iban && details.bank) {
              bankDetails = details;
              break;
            }
          }
        }
      }

      return res.status(200).json({
        success: true,
        bankDetails: bankDetails,
        lastUpdateId: newLastUpdateId
      });
    }

    return res.status(200).json({
      success: true,
      bankDetails: null,
      lastUpdateId: lastUpdateId
    });

  } catch (error) {
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
};
