import {Village} from '../models/VillageSchema.js';
import { v4 as uuidv4 } from 'uuid';
export const addSubAgent = async (req, res) => {
    try {
        const { villageId } = req.params;
        const { name, phoneNumber, username, password, token } = req.body;

        const village = await Village.findByIdAndUpdate(
            villageId,
            { 
                $push: { 
                    subagents: { 
                        name, 
                        phone: phoneNumber, 
                        username, 
                        password, 
                        token: token || crypto.randomBytes(3).toString('hex').toUpperCase(), 
                        isAuthorized: true, 
                        count: 0 
                    } 
                } 
            },
            { new: true }
        );
        res.json({ success: true, data: village });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const updateSubAgent = async (req, res) => {
    try {
        const { villageId, agentId } = req.params;
        const { name, phoneNumber, username, password, token, isAuthorized } = req.body;

        const updateFields = {};
        if (name !== undefined) updateFields["subagents.$.name"] = name;
        if (phoneNumber !== undefined) updateFields["subagents.$.phone"] = phoneNumber;
        if (username !== undefined) updateFields["subagents.$.username"] = username;
        if (password !== undefined) updateFields["subagents.$.password"] = password;
        if (token !== undefined) updateFields["subagents.$.token"] = token;
        if (isAuthorized !== undefined) updateFields["subagents.$.isAuthorized"] = isAuthorized;

        const village = await Village.findOneAndUpdate(
            { _id: villageId, "subagents._id": agentId },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!village) return res.status(404).json({ success: false, message: "Not found" });

        res.json({ success: true, data: village });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
export const getSubagents = async (req, res) => {
    try {
        const villages = await Village.find({ mandalId: req.params.mandalId }, 'name subagents')
            .sort({ name: 1 }).lean();
        const subagentList = villages.map(v => ({
            villageName: v.name,
            villageId: v._id,
            details: v.subagents
        }));
        res.json(subagentList);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getVillages= async (req, res) => {
    try {
        const villages = await Village.find({ mandalId: req.params.mandalId }, 'name').lean();
        if (!villages || villages.length === 0) return res.status(200).json([]);
        res.json(villages.map(v => v.name));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getVillagesByMandals = async (req, res) => {
    try {
        const { mandalId } = req.params;
        const villages = await Village.find({ mandalId });
        res.json({ success: true, data: villages });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};