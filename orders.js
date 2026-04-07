const { kv } = require('@vercel/kv');

function genId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: admin gets all, user gets by room
  if (req.method === 'GET') {
    const { password, room } = req.query;
    const orders = await kv.get('orders') || [];
    if (password === process.env.ADMIN_PASSWORD) {
      return res.json(orders);
    } else if (room) {
      return res.json(orders.filter(o => o.room === room.trim()));
    }
    return res.status(401).json({ error: '请提供房号或管理员密码' });
  }

  // POST: create order
  if (req.method === 'POST') {
    const { room, items, total, note } = req.body;
    if (!room || !items || !items.length) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const config = await kv.get('config') || {};
    if (config.shopOpen === false) {
      return res.status(400).json({ error: '本期已截单，敬请期待下次团购通知' });
    }

    const order = {
      id: genId(),
      room: room.trim(),
      items,
      total,
      note: (note || '').trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    const orders = await kv.get('orders') || [];
    orders.push(order);
    await kv.set('orders', orders);

    return res.json({ success: true, orderId: order.id });
  }

  // PUT: update order status
  if (req.method === 'PUT') {
    const { id, status, password } = req.body;
    const orders = await kv.get('orders') || [];
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) return res.status(404).json({ error: '订单不存在' });

    const isAdmin = password === process.env.ADMIN_PASSWORD;

    if (isAdmin) {
      if (status) orders[idx].status = status;
    } else {
      // User can only cancel
      if (status !== 'cancelled') return res.status(403).json({ error: '无权操作' });
      const config = await kv.get('config') || {};
      if (config.harvestStarted) {
        return res.status(400).json({ error: '已开始采摘，无法取消订单，如有问题请联系卖家' });
      }
      orders[idx].status = 'cancelled';
    }

    await kv.set('orders', orders);
    return res.json({ success: true });
  }

  // DELETE: admin clears all orders
  if (req.method === 'DELETE') {
    const { password } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: '密码错误' });
    }
    await kv.set('orders', []);
    return res.json({ success: true });
  }

  res.status(405).end();
};
