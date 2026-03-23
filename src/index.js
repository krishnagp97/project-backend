import { ConnectDB } from "./db/index.js";
import { app } from "./app.js";
import http from "http";
import dotenv from "dotenv";
import { initSocket } from "./utils/socket.js";
dotenv.config();

const server = http.createServer(app);

ConnectDB()
    .then(() => {
        initSocket(server);
        server.listen(process.env.PORT || 8000, () => {
            console.log(`server listen on port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("mongo db connection failed", err);
    });
