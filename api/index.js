import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // Cache 5 menit
const EXTERNAL_BASE_URL = 'https://www.sankavollerei.web.id/anime';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const endpoint = req.url.replace(/^\/api/, '');
  const cacheKey = endpoint;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  try {
    const targetUrl = `${EXTERNAL_BASE_URL}${endpoint}`;
    const response = await axios.get(targetUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    cache.set(cacheKey, response.data);
    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(error.response?.status || 500).json({
      message: 'Server Error Proxying Request',
      error: error.message
    });
  }
}
