const { kv } = require('@vercel/kv');

const DEFAULT_CONFIG = {
  shopOpen: true,
  harvestStarted: false,
  announcement: '',
  qrCodeUrl: '',
  shopName: '自家菜地-新鲜蔬菜采摘'
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const config = await kv.get('config') || DEFAULT_CONFIG;
    return res.json(config);
  }

  if (req.method === 'PUT') {
    const { password, ...updates } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: '密码错误' });
    }
    const current = await kv.get('config') || DEFAULT_CONFIG;
    const next = { ...current, ...updates };
    await kv.set('config', next);
    return res.json({ success: true, config: next });
  }

  res.status(405).end();
};
