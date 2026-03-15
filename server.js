import express from 'express';
import { connectDB } from './db/connection.js';
import Routes from './routes/index.js';
import cors from 'cors';
import cookieParser from 'cookie-parser'; 
import dotenv from 'dotenv';

dotenv.config(); 

const app = express();


app.use(cors({
  origin: '*', 
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

connectDB();

app.use('/api', Routes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 HariyaliMart Server running on port ${PORT}`));