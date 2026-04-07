const { kv } = require('@vercel/kv');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const orders = await kv.get('orders') || [];
  const active = orders.filter(o => o.status !== 'cancelled');
  const uniqueRooms = new Set(active.map(o => o.room));

  return res.json({
    participants: uniqueRooms.size,
    totalOrders: active.length,
    paidCount: active.filter(o => o.status === 'paid').length
  });
};
