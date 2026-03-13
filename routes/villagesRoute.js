import express from 'express';
import { getVillagesByMandals,addSubAgent,updateSubAgent,getVillages } from '../controllers/villageController.js';

const router = express.Router();
router.get('/villages/mandal/:mandalId', getVillagesByMandals);
router.get('/villages/:mandalId', getVillages);
router.post('/villages/:villageId/subagent', addSubAgent);
router.put('/villages/:villageId/subagents/:agentId', updateSubAgent);

export default router;