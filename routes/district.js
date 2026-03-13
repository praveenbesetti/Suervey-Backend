import express from 'express';
import { getDistricts } from '../controllers/districController.js';

const router = express.Router();
router.get('/districts', getDistricts);
export default router;