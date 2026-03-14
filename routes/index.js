import express from 'express';
import Village from './villagesRoute.js';
import District from './district.js';
import Mandal from './mandalRoute.js';
import Auth from './authRouter.js';
import SurveyForm from './surveyFormRoute.js';

const router = express.Router();

router.use('/auth', Auth);
router.use('/districts', District);
router.use('/mandals', Mandal);
router.use('/villages', Village);
router.use('/surveys', SurveyForm);

export default router;