const axios = require("axios");
const coinmarketcapApi = axios.create({
    method: 'GET',
    baseURL: 'https://pro-api.coinmarketcap.com',
    headers: {
        'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY,
        Accept: "application/json",
        "Accept-Encoding": "deflate, gzip",
    },
});
const coingeckerApi = axios.create({
    method: 'GET',
    baseURL: 'https://api.coingecko.com',
});
module.exports = { coinmarketcapApi, coingeckerApi }