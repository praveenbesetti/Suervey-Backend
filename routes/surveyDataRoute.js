import express from 'express';
import { getGroupedSurveyData } from '../controllers/SurveyDataController.js';

const router = express.Router();
router.get('/grouped', getGroupedSurveyData);

export default router;