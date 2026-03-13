import express from 'express';
import { District } from '../models/DistrictSchema.js';
const router = express.Router();


export const getDistricts = async (req, res) => {
    try {
        const districts = await District.find({}, 'name').sort({ name: 1 }).lean();
        res.json(districts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};










