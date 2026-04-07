const { kv } = require('@vercel/kv');

const DEFAULT_PRODUCTS = [
  {
    id: '1',
    name: '普罗旺斯西红柿',
    price: 20,
    unit: '份',
    unitDesc: '5斤/份',
    description: '自家种植，新鲜采摘，无农药',
    image: '',
    available: true
  },
  {
    id: '2',
    name: '新鲜青菜',
    price: 5,
    unit: '斤',
    unitDesc: '5元/斤',
    description: '当天采摘，新鲜美味',
    image: '',
    available: true
  }
];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    let products = await kv.get('products');
    if (!products) {
      products = DEFAULT_PRODUCTS;
      await kv.set('products', products);
    }
    return res.json(products);
  }

  if (req.method === 'PUT') {
    const { password, products } = req.body;
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: '密码错误' });
    }
    await kv.set('products', products);
    return res.json({ success: true });
  }

  res.status(405).end();
};
