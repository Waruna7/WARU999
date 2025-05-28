const axios = require('axios');

async function getBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return res.data;
}

module.exports = { getBuffer };
