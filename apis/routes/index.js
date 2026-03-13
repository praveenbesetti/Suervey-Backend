import express from 'express';
import * as surveyController from './surveyRoutes.js';

const router = express.Router();

// Define Routes
router.get('/districts', surveyController.getDistricts);
router.get('/mandals/:districtId', surveyController.getMandals);
router.get('/agent/:mandalId', surveyController.getAgentDetails);
router.get('/villages/:mandalId', surveyController.getVillagesByMandal);
router.get('/subagents/:mandalId', surveyController.getSubagents);
router.post('/form', surveyController.submitSurveyForm);
router.post('/survey/submit', surveyController.authenticateUser);
router.get('/surveys/grouped', surveyController.getGroupedSurveyData);

export default router;