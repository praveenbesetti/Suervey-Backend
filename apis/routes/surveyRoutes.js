import express from 'express';
import { District } from '../../model/DistrictSchema.js';
import { Mandal } from '../../model/MandalSchema.js';
import { Village } from '../../model/VillageSchema.js';
import { Survey } from "../../model/survey.js";
import crypto from 'crypto';
const router = express.Router();


const generateRandomLetters = (length) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};

export const getDistricts = async (req, res) => {
    try {
        const districts = await District.find({}, 'name').sort({ name: 1 }).lean();
        res.json(districts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getMandals = async (req, res) => {
    try {
        const mandals = await Mandal.find({ districtId: req.params.districtId }, 'name')
            .sort({ name: 1 })
            .lean();
        res.json(mandals);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAgentDetails = async (req, res) => {
    try {
        const agent = await Mandal.findById(req.params.mandalId, 'name username agentPhone').lean();
        res.json(agent);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getVillagesByMandal = async (req, res) => {
    try {
        const villages = await Village.find({ mandalId: req.params.mandalId }, 'name').lean();
        if (!villages || villages.length === 0) return res.status(200).json([]);
        res.json(villages.map(v => v.name));
    } catch (err) {
        res.status(500).json({ error: err.message });
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

export const getGroupedSurveyData = async (req, res) => {
    try {
        const { district, mandal } = req.query;

        let filter = {};
        if (district) filter.districtName = { $regex: district, $options: "i" };
        if (mandal) filter.MandalName = { $regex: mandal, $options: "i" };

        // 2. Aggregate Data
        const groupedData = await Survey.aggregate([
            { $match: filter },
            {
                $group: {
                 
                    _id: {
                        district: "$districtName",
                        mandal: "$MandalName"
                    },
                    // Meta data for each group
                    surveyCount: { $sum: 1 }, 

                    rice: { $sum: "$consumption.rice.value" },
                    wheat: { $sum: "$consumption.wheat.value" },
                    toorDal: { $sum: "$consumption.toorDal.value" },
                    moongDal: { $sum: "$consumption.moongDal.value" },
                    chanaDal: { $sum: "$consumption.chanaDal.value" },
                    oil: { $sum: "$consumption.oil.value" },
                    sugar: { $sum: "$consumption.sugar.value" },
                    salt: { $sum: "$consumption.salt.value" },
                    tea: { $sum: "$consumption.tea.value" },
                    milk: { $sum: "$consumption.milk.value" },
                    eggs: { $sum: "$consumption.eggs.value" },
                    bathSoap: { $sum: "$consumption.bathSoap.value" },
                    shampoo: { $sum: "$consumption.shampoo.value" },
                    detergent: { $sum: "$consumption.detergent.value" },
                    dishWash: { $sum: "$consumption.dishWash.value" },
                    toothpaste: { $sum: "$consumption.toothpaste.value" }
                }
            },
            {
                $project: {
                    _id: 0,
                    district: "$_id.district",
                    mandal: "$_id.mandal",
                    surveyCount: 1,
                    rice: 1,
                    wheat: 1,
                    toorDal: 1,
                    moongDal: 1,
                    chanaDal: 1,
                    oil: 1,
                    sugar: 1,
                    salt: 1,
                    tea: 1,
                    milk: 1,
                    eggs: 1,
                    bathSoap: 1,
                    shampoo: 1,
                    detergent: 1,
                    dishWash: 1,
                    toothpaste: 1
                }
            },
            { $sort: { district: 1, mandal: 1 } }
        ]);

        res.json({
            success: true,
            totalLocations: groupedData.length,
            data: groupedData
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};