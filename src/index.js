import { ConnectDB } from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv";
dotenv.config();

ConnectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`server listen on port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("mongo db connection failed", err);
    });
