import crypto from 'crypto';
import { Village } from '../models/VillageSchema.js';
import {Survey} from '../models/SurveySchema.js';

function generateRandomLetters(length) {
    return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

export const submitSurveyForm = async (req, res) => {
    try {
        const { village, mandalId } = req.body;
        req.body.surveyId = `${generateRandomLetters(3)}-${crypto.randomInt(100000000, 999999999)}`;

        const survey = new Survey(req.body);
        await survey.save();

        const updatedVillage = await Village.findOneAndUpdate(
            { name: { $regex: new RegExp(`^${village.trim()}$`, "i") }, mandalId },
            { $inc: { count: 1 } },
            { new: true }
        );

        res.status(201).json({
            message: "Survey saved and count updated",
            surveyId: survey.surveyId,
            currentCount: updatedVillage?.count || 0
        });
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
};