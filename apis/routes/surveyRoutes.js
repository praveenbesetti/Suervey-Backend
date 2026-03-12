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

export const getSurveyData = async (req, res) => {
    try {
        const { district, mandal, village, page = 1, limit = 50 } = req.query;
        let filter = {};
        if (district) filter.district = district;
        if (mandal) filter.mandal = mandal;
        if (village) filter.village = village;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [families, totalRecords, totalsAggregation] = await Promise.all([
            Survey.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
            Survey.countDocuments(filter),
            Survey.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
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
                }
            ])
        ]);

        res.json({
            families,
            totals: totalsAggregation[0] || {},
            pagination: { totalRecords, currentPage: parseInt(page), totalPages: Math.ceil(totalRecords / limit) }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};