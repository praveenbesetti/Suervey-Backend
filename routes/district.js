import express from 'express';
import { getDistricts } from '../controllers/districController.js';

const router = express.Router();
router.get('/', getDistricts);
export default router;