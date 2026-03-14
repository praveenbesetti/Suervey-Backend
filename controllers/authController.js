import crypto from 'crypto';
import { Mandal } from '../models/MandalSchema.js';
import { Village } from '../models/VillageSchema.js';
import { Survey } from '../models/SurveySchema.js';

export const authenticateUser = async (req, res) => {
    try {
        const { role, mandalId, village, username, password, token } = req.body;

        if (role === 'agent') {
            const mandal = await Mandal.findById(mandalId).lean();
            if (!mandal || mandal.username !== username || mandal.password !== password) {
                return res.status(401).json({ error: "Invalid Agent credentials." });
            }
            const { username: _, password: __, ...safeData } = mandal;
            return res.json({ success: true, data: { ...safeData, mandalId: safeData._id, mandalName: safeData.name } });
        }

        if (role === 'subagent') {
            const newToken = crypto.randomBytes(3).toString('hex').toUpperCase();
            const result = await Village.findOneAndUpdate(
                {
                    name: { $regex: new RegExp(`^${village.trim()}$`, "i") },
                    mandalId,
                    "subagents.username": username,
                    "subagents.password": password,
                    "subagents.token": token
                },
                { $set: { "subagents.$.token": newToken } },
                { new: true }
            ).populate({ path: 'mandalId', populate: { path: 'districtId' } });

            if (!result) return res.status(401).json({ error: "Invalid credentials." });

            return res.json({
                success: true,
                data: {
                    villageId: result._id,
                    villageName: result.name,
                    SurveyorId: result.subagents.surveyorId,
                    mandalName: result.mandalId?.name,
                    districtName: result.mandalId?.districtId?.name,
                    token: newToken
                }
            });
        }
        res.status(400).json({ error: "Invalid role." });
    } catch (err) {
        res.status(500).json({ error: "Internal server error." });
    }
};
