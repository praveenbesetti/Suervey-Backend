import express from 'express';
import { connectDB } from './db/connection.js';
import { initSurveyRoutes } from './apis/routes/surveyRoutes.js';
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(cors({
  origin: '*', // For development, this allows all connections
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
connectDB();
initSurveyRoutes(app);

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));