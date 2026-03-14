import { v4 as uuidv4 } from 'uuid';
import {Village} from '../models/VillageSchema.js';

/**
 * Standalone function to patch missing Surveyor IDs
 * without being blocked by validation.
 */
export const initializeAllSurveyorIds = async () => {
    try {
        console.log("--- Starting Surveyor ID Sync ---");

        // 1. Only fetch villages where at least one agent is missing an ID
        const villages = await Village.find({ 
            "subagents.surveyorId": { $exists: false } 
        });

        if (villages.length === 0) {
            console.log("✅ All agents already have Surveyor IDs.");
            return;
        }

        let updatedCount = 0;

        for (const village of villages) {
            for (const agent of village.subagents) {
                // 2. Skip agents that already have an ID
                if (!agent.surveyorId) {
                    const newId = `SURV-${uuidv4().split('-')[0].toUpperCase()}`;

                    // 3. Directly update the specific array element in MongoDB
                    // This bypasses full document validation
                    await Village.updateOne(
                        { _id: village._id, "subagents._id": agent._id },
                        { $set: { "subagents.$.surveyorId": newId } }
                    );

                    updatedCount++;
                }
            }
        }

        console.log(`✅ Sync complete. Total agents updated: ${updatedCount}`);
    } catch (error) {
        console.error("❌ Error during Surveyor ID sync:", error.message);
    }
};