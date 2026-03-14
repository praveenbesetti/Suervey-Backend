import express from 'express';
import { getAgentDetailsByDistrict, getMandals,updateMandalAgent } from '../controllers/mandalController.js';

const router = express.Router();
router.get('/agent/:districtId', getAgentDetailsByDistrict);
router.get('/:districtId', getMandals);
router.put('/:mandalId/agent', updateMandalAgent);
export default router;