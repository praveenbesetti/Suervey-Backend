import express from 'express';
import Village from './villagesRoute.js';
import District from './district.js';
import Mandal from './mandalRoute.js';
import Auth from './authRouter.js';
import SurveyForm from './surveyFormRoute.js';

const router = express.Router();
router.use('/', Auth);
router.use('/', District);
router.use('/', Mandal);
router.use('/', Village);
router.use('/', SurveyForm);

export default router;