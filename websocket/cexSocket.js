const WebSocket = require('ws');
const fs = require("fs");
const moment = require("moment");

const { createAuthRequest } = require("../lunance");
const { cexApi } = require("../utils/http");

module.exports = (uni) => {
    const { app, io } = uni;
    app.io = io;
    const appIO = app.io;


    const useSocket = (callback) => {

        io.on('connection', socket => {
            console.log("Có người kết nối", socket.id);

            callback(socket)
            socket.on("disconnect", (socket) => {
                console.log(socket.id, " ngắt kết nối");
            });
        });
    }



    const initCexSocketLAN1 = () => {
        const ws = new WebSocket('wss://ws.cex.io/ws/');

        const configFile = fs.readFileSync("./config.json", "utf-8");

        const auth = JSON.parse(configFile);

        const authRequest = createAuthRequest(auth.KEY, auth.SECRET)
        // Connection Opened:
        ws.on('open', async () => {

            console.log('WS Connected!');

            const pair = [];

            try {
                const response = await cexApi("get_ticker");
                const key = Object.keys(response.data.data);
                if (key && key.length > 0) pair.push(...key)
            } catch (error) {
                console.error(error)
            }
            console.log(pair)
            const request1 = (pair) => {
                return {
                    e: "subscribe",
                    rooms: pair.map(item => {
                        return `pair-${item}`;
                    })
                }
            }


            const request2 = {
                e: 'order-book-subscribe',
                data: {
                    pair: pair,
                    subscribe: true, depth: 50
                },
                oid: '1435927928274_3_order-book-subscribe'
            }
            // const request3 = {
            // 	e: "init-ohlcv",
            // 	i: "1d",
            // 	rooms: [
            // 		"pair-ADA-USD"
            // 	]
            // }
            const request = [request1];

            request.map(item => {
                ws.send(JSON.stringify(item(pair)))
            });
            useSocket((socket) => {
                socket.on("get_md", (data) => {
                    if (data) {
                        ws.send(JSON.stringify(request1([data])))
                    }
                })
            })
            //auth app;
            ws.send(authRequest);
            //Request to get data;
            // ws.send(JSON.stringify(
            // 	request1
            // 		// {
            // 		// 	"e": "subscribe",
            // 		// 	"rooms": ["pair-NEO-USD"]
            // 		// }


            // 	// {
            // 	// 	"e": "order-book-subscribe",
            // 	// 	"data": {
            // 	// 	"pair": [
            // 	// 		  "BTC",
            // 	// 		  "USD"
            // 	// 		  ],
            // 	// 		  "subscribe": true,
            // 	// 		  "depth": 10
            // 	// 	},
            // 	// 	"oid": "1435927928274_3_order-book-subscribe"
            // 	// 	}

            // 	//Api for OHLCV charts subscriptions
            // 	// {
            // 	// 	"e": "init-ohlcv",
            // 	// 	"i": "1m",
            // 	// 	"rooms": [
            // 	// 	   "pair-BTC-USD"
            // 	// 	],

            // 	// }
            // 	//Thường sử dụng 1d, gửi cái nào thì 1d cũng xuất hiện
            // 	//Volume thì nó không fomat tự tạo hàm mà giã
            // 	//Api for OHLCV charts subscriptions
            // // ));
            // ws.send(JSON.stringify(request2))

        })

        // Per message packet:
        ws.on('message', (data) => {
            data = JSON.parse(data);
            // console.log(data)

            switch (data.e) {
                case "md":
                    console.log(data)
                    const { id, buy, sell, buy_total, pair, sell_total } = data.data;
                    const satoshi = 1 / 100000000;
                    const newBuy = buy.map(item => {
                        return [item[0], item[1] * satoshi];
                    })
                    const newSell = sell.map(item => {
                        return [item[0], item[1] * satoshi];
                    })
                    const max_buy = buy.reduce((total, buy) => {
                        return total + Number(buy[0] * buy[1] * satoshi);
                    }, 0);
                    const max_sell = sell.reduce((total, sell) => {
                        return Number(total + Number(sell[0] * sell[1] * satoshi));
                    }, 0);
                    const newData = { id, buy: newBuy, sell: newSell, buy_total: max_buy, sell_total: max_sell, pair }
                    appIO.sockets.emit("md_data[" + pair.split(":").join("-").concat("]"), newData);

                    break;
                case "md_groupped":
                    // console.log(data)

                    appIO.sockets.emit("md_groupped_data", data);
                    break;
                case "md_update":
                    appIO.sockets.emit("md_update_data", data);
                    break;
                case "history":
                    appIO.sockets.emit("history_data", data);
                    break;
                case "tick":
                    console.log(data)
                    break;
                default:

                    break;
            }

        })

        ws.on('error', (error) => {
            console.log("Hệ thống xảy ra lỗi!")
            console.error(error);
            try {
                console.log('Khởi tạo kết nối mới');
                initCexSocketLAN1();
                console.log('Khởi tạo thành công');

            } catch (error) {
                console.log('Khởi tạo thất bại');
                console.error(error);

            }
        })

        ws.on('close', () => {
            console.log('Kết nối đã đóng');
            try {
                console.log('Khởi tạo kết nối mới');
                initCexSocketLAN1();
                console.log('Khởi tạo thành công');

            } catch (error) {
                console.log('Khởi tạo thất bại');
                console.error(error);

            }
            // Xử lý các công việc sau khi kết nối đã đóng
        });
    }

    // // const initCexSocketLAN2 = (appIO) => {
    // //     const wss = new WebSocket('wss://api.plus.cex.io/ws-public');
    // //     //||wss
    // //     // Connection Opened:
    // //     wss.on('open', () => {

    // //         const now = moment();

    // //         const backTime = now.add(1, "days").valueOf();
    // //         const getTime = moment(backTime);

    // //         useSocket((socket) => {
    // //             socket.on("get_candles", (data) => {

    // //                 const request1 = { e: "ping" };
    // //                 const request2 =
    // //                 {
    // //                     e: "get_candles",
    // //                     oid: "16760394893891_get_candles",
    // //                     ok: "ok",
    // //                     data: {
    // //                         pair: data.pair || "BTC-USD",
    // //                         toISO: getTime,
    // //                         limit: data.limit || 100,
    // //                         dataType: "bestAsk",
    // //                         resolution: data.resolution || "1d"
    // //                     },
    // //                 }
    // //                 const request3 = {

    // //                 }

    // //                 const requestArr = [request1, request2];
    // //                 requestArr.map(item => {
    // //                     wss.send(JSON.stringify(item))
    // //                 })
    // //             }
    // //             )
    // //         })




    // //     })

    // //     // Per message packet:
    // //     wss.on('message', (data) => {
    // //         data = JSON.parse(data);
    // //         console.log(data)
    // //         switch (data.e) {
    // //             case "get_candles":
    // //                 // const { timestamp, open, high, low, close, volume, resolution, isClosed, timestampISO } = data.data
    // //                 // const 

    // //                 appIO.sockets.emit("candles_data", data.data);

    // //                 break;

    // //             default:
    // //                 break;
    // //         }


    // //     })

    // //     wss.on('error', console.log)
    // //     //||wss
    // // }

    // // initCexSocketLAN1(appIO);
    // // initCexSocketLAN2(appIO);
    initCexSocketLAN1();
}






