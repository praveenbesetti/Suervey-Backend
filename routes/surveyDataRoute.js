import express from 'express';
import { getGroupedSurveyData } from '../controllers/SurveyDataController.js';

const router = express.Router();
router.get('/surveys/grouped', getGroupedSurveyData);

export default router;