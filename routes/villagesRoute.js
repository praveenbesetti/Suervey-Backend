import express from 'express';
import { getVillagesByMandals,addSubAgent,updateSubAgent,getVillages } from '../controllers/villageController.js';

const router = express.Router();
router.get('/mandal/:mandalId', getVillagesByMandals);
router.get('/:mandalId', getVillages);
router.post('/:villageId/subagent', addSubAgent);
router.put('/:villageId/subagent/:agentId', updateSubAgent);

export default router;

