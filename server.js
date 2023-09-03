const express = require("express");
const app = express();
const cors = require("cors")
app.use(cors());
app.set("view engine", "ejs");
app.set("views", "./views");
require('dotenv').config();

const coinInit = require("./apis/coinApi")
//Application EndPoint API Router
coinInit(app)
//Application EndPoint API Router



const server = require("http").Server(app);

const io = require("socket.io")(server, {
	cors: {
		origin: "*",
	}
});

// app.io = io;
//Init Websocket Cex server
const initSocket = require("./websocket/cexSocket");
initSocket({ io, app });
//Init Websocket Cex server
server.listen(3000, (params) => {
	console.log("Server Start")
});


