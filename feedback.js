const { kv } = require('@vercel/kv');

function genId() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { password } = req.query;
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: '无权访问' });
    }
    const feedbacks = await kv.get('feedbacks') || [];
    return res.json(feedbacks);
  }

  if (req.method === 'POST') {
    const { room, content, rating } = req.body;
    if (!room || !content) {
      return res.status(400).json({ error: '请填写房号和评价内容' });
    }
    const feedback = {
      id: genId(),
      room: room.trim(),
      content: content.trim(),
      rating: Math.min(5, Math.max(1, parseInt(rating) || 5)),
      createdAt: new Date().toISOString()
    };
    const feedbacks = await kv.get('feedbacks') || [];
    feedbacks.push(feedback);
    await kv.set('feedbacks', feedbacks);
    return res.json({ success: true });
  }

  res.status(405).end();
};
