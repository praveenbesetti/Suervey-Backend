import express from 'express';
import { connectDB } from './db/connection.js';
import Routes from './routes/index.js';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // 1. Added cookie parser
import dotenv from 'dotenv';

dotenv.config(); // 2. Load env at the very top to fix JWT Secret error

const app = express();


app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // ALLOWS THE APK
    if (["https://hariyalimart.duckdns.org"].includes(origin)) return callback(null, true);
    callback(new Error("CORS Blocked"));
  },
  credentials: true
}));



app.use(express.json());
app.use(cookieParser()); // 4. Use cookie parser before routes

connectDB();

app.use('/api', Routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 HariyaliMart Server running on port ${PORT}`));