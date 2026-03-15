import express from 'express';
import { connectDB } from './db/connection.js';
import Routes from './routes/index.js';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // 1. Added cookie parser
import dotenv from 'dotenv';

dotenv.config(); // 2. Load env at the very top to fix JWT Secret error

const app = express();

// 3. Fixed CORS (Typo: hhtp -> http) and added credentials support
app.use(cors({
  origin: 'http://35.244.242.193:80', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true // MANDATORY for cookies to work
}));

app.use(express.json());
app.use(cookieParser()); // 4. Use cookie parser before routes

connectDB();

app.use('/api', Routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 HariyaliMart Server running on port ${PORT}`));