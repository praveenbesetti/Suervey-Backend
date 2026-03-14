import express from 'express';
import { connectDB } from './db/connection.js';
import Routes from './routes/index.js';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
connectDB();

app.use('/api', Routes);
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));