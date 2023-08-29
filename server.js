const express = require("express");
const axios = require("axios")
const fs = require("fs")
const app = express();
const cors = require("cors")
app.use(cors());
app.set("view engine", "ejs");
app.set("views", "./views");
require('dotenv').config();

const moment = require("moment");

const server = require("http").Server(app);

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
	}
});

const coinInit = require("./apis/coinApi")
//Application EndPoint API Router
coinInit(app)
//Application EndPoint API Router

app.io = io;

console.log()
const useSocket = (callback) => {

	io.on('connection', socket => {
		console.log("Có người kết nối", socket.id);

		callback(socket)
		socket.on("disconnect", (socket) => {
			console.log(socket.id, " ngắt kết nối");
		});
	});
}


const { createAuthRequest, readJsonn } = require("./lunance");

const configFile = fs.readFileSync("./config.json", "utf-8");

const auth = JSON.parse(configFile);

const authRequest = createAuthRequest(auth.KEY, auth.SECRET)
console.log(authRequest)
const WebSocket = require('ws');


const ws = new WebSocket('wss://ws.cex.io/ws/');

// const wss = new WebSocket('wss://api.plus.cex.io/ws');

const wss = new WebSocket('wss://api.plus.cex.io/ws-public');

//||ws
// Connection Opened:
ws.on('open', () => {

	console.log('WS Connected!');

	const pair = ["BTC", "USD"]

	const request1 = {
		e: "subscribe",
		rooms: [`pair-${pair[0] + "-" + pair[1]}`, `tickers`]
	}

	const request2 = {
		e: 'order-book-subscribe',
		data: {
			pair: pair,
			subscribe: true, depth: 50
		},
		oid: '1435927928274_3_order-book-subscribe'
	}
	const request3 = {
		e: "init-ohlcv",
		i: "1d",
		rooms: [
			"pair-BTC-USD"
		]
	}
	const request = [request1];

	request.map(item => {
		ws.send(JSON.stringify(item))
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
			app.io.sockets.emit("md_data", newData);
			break;
		case "md_groupped":
			app.io.sockets.emit("md_groupped_data", data);
			break;
		case "md_update":
			app.io.sockets.emit("md_update_data", data);
			break;
		case "history":
			app.io.sockets.emit("history_data", data);
			break;
		case "tick":
			console.log(data)
			break;
		default:

			break;
	}

})

ws.on('error', console.log)
//||ws
// useSocket((socket) => {
// 	socket.on("get_candles", (data) => {
// 		console.log(data)
// 	})
// })
//||wss
// Connection Opened:
wss.on('open', () => {

	const now = moment();

	const backTime = now.add(1, "days").valueOf();
	const getTime = moment(backTime);

	useSocket((socket) => {
		socket.on("get_candles", (data) => {

			const request1 = { e: "ping" };
			const request2 =
			{
				e: "get_candles",
				oid: "16760394893891_get_candles",
				ok: "ok",
				data: {
					pair: data.pair || "BTC-USD",
					toISO: getTime,
					limit: data.limit || 100,
					dataType: "bestAsk",
					resolution: data.resolution || "1d"
				},
			}
			const request3 = {

			}

			const requestArr = [request1, request2];
			requestArr.map(item => {
				wss.send(JSON.stringify(item))
			})
		}
		)
	})




})

// Per message packet:
wss.on('message', (data) => {
	data = JSON.parse(data);
	console.log(data)
	switch (data.e) {
		case "get_candles":
			// const { timestamp, open, high, low, close, volume, resolution, isClosed, timestampISO } = data.data
			// const 

			app.io.sockets.emit("candles_data", data.data);

			break;

		default:
			break;
	}


})

wss.on('error', console.log)
//||wss


server.listen(3000, (params) => {
	console.log("Server Start")
}
);

