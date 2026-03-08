import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const ConnectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URL}/${process.env.DB_NAME}`
        );
        console.log(
            `database connect ! DB HOST: ${connectionInstance.connection.host}`
        );
    } catch (error) {
        console.log("error in connecting Mongodb", error);
        process.exit(1);
    }
};

export { ConnectDB };
