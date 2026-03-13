import express from 'express';
import { getAgentDetailsByDistrict, getMandals,updateMandalAgent } from '../controllers/mandalController.js';

const router = express.Router();
router.get('/mandals/:districtId', getMandals);
router.get('/agent/:districtId', getAgentDetailsByDistrict);
router.put('/mandals/:mandalId/agent', updateMandalAgent);
export default router;