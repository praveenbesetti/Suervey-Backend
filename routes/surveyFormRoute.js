import express from 'express';
import { submitSurveyForm } from '../controllers/surveyForm.js';

const router = express.Router();
router.post('/form', submitSurveyForm);
export default router;