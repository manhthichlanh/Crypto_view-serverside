
const { coinmarketcapApi, coingeckerApi } = require("../utils/http")

module.exports = (app) => {
    app.get('/api/currency/info', async (req, res) => {
        try {
            const { limit } = req.query;
            const response = await coinmarketcapApi.get(`/v1/cryptocurrency/listings/latest?limit=${limit}`);
            const data = response.data.data;

            const logoResponse = await coinmarketcapApi.get('/v1/cryptocurrency/info', {
                params: {
                    id: data.map(coin => coin.id).join(','),
                }
            });

            const logoData = logoResponse.data.data;

            // Combine logo information into the main data
            const combinedData = data.map(coin => ({
                ...coin,
                logo: logoData[coin.id].logo,
            }));

            res.json(combinedData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Có lỗi khi fetching data.' });
        }

    });
    app.get("/api/currency/trending", async (req, res) => {
        try {
            const trendingResponse = await coingeckerApi("api/v3/search/trending")
            const trendingData = trendingResponse.data.coins;
            res.json(trendingData)
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Có lỗi khi fetching data.' });
        }

    })

}
