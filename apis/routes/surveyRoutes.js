import express from 'express';
import { District } from '../../model/DistrictSchema.js';
import { Mandal } from '../../model/MandalSchema.js';
import { Village } from '../../model/VillageSchema.js';
import { Survey } from "../../model/survey.js";
import crypto from 'crypto';
const router = express.Router();

function generateRandomLetters(length) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += letters.charAt(Math.floor(Math.random() * letters.length))
    }
    return result
}

export const initSurveyRoutes = (app) => {

    // 1. Get All Districts
    router.get('/districts', async (req, res) => {
        try {
            const districts = await District.find({}, 'name').sort({ name: 1 }).lean();
            res.json(districts);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 2. Get Mandals by District ID
    router.get('/mandals/:districtId', async (req, res) => {
        try {
            const mandals = await Mandal.find({ districtId: req.params.districtId }, 'name')
                .sort({ name: 1 })
                .lean();
            res.json(mandals);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // 3. Get Agent Details (Mandal Head)
    router.get('/agent/:mandalId', async (req, res) => {
        try {
            const agent = await Mandal.findById(req.params.mandalId, 'name username agentPhone')
                .lean();
            res.json(agent);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    router.get('/Villages/:mandalId', async (req, res) => {
        try {
            console.log("Fetching villages for Mandal ID:", req.params.mandalId);

            // 1. Use .find() to get all documents that match the mandalId
            // We only select the 'name' field
            const villages = await Village.find({ mandalId: req.params.mandalId }, 'name').lean();

            if (!villages || villages.length === 0) {
                console.log("No villages found for this Mandal.");
                return res.status(200).json([]);
            }

            const villageNamesOnly = villages.map(v => v.name);

            res.json(villageNamesOnly);
        } catch (err) {
            console.error("Error fetching villages:", err.message);
            res.status(500).json({ error: err.message });
        }
    });



    // 4. Get Subagents & Villages by Mandal ID (For Agent Table)
    router.get('/subagents/:mandalId', async (req, res) => {
        try {
            const villages = await Village.find({ mandalId: req.params.mandalId }, 'name subagents')
                .sort({ name: 1 })
                .lean();

            const subagentList = villages.map(v => ({
                villageName: v.name,
                villageId: v._id,
                details: v.subagents
            }));
            console.log("Subagent List:", subagentList);
            res.json(subagentList);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });


    router.post("/form", async (req, res) => {
        try {
            req.body.surveyId = generateRandomLetters(3) + "-" + crypto.randomInt(100000000, 999999999)
            const survey = new Survey(req.body)
            await survey.save()
            res.status(201).json({ message: "Survey saved", surveyId: survey.surveyId })
        } catch (err) {
            console.error(err)
            res.status(500).json(err)
        }
    })
    router.post('/survey/submit', async (req, res) => {
        try {
            const { role, mandalId, village, username, password, token } = req.body;

            if (role === 'agent') {
                const mandal = await Mandal.findById(mandalId).lean();

                if (!mandal) {
                    return res.status(404).json({ error: "Mandal not found." });
                }

                // Compare exactly: Username and Password
                if (mandal.username !== username || mandal.password !== password) {
                    return res.status(401).json({ error: "Invalid Agent credentials." });
                }

                const { username: _, password: __, ...safeMandalData } = mandal;

                return res.status(200).json({
                    success: true,
                    message: "Agent Authenticated",
                    data: {
                        ...safeMandalData,
                        mandalId: safeMandalData._id,
                        mandalName: safeMandalData.name,// <--- Explicitly add this line
                    }
                });
            }

            else if (role === 'subagent') {
                const cleanVillage = village.trim();
                const newToken = crypto.randomBytes(3).toString('hex').toUpperCase();
                console.log(newToken);
                // Find village, match subagent username/password/oldToken, and set the NEW token
                const result = await Village.findOneAndUpdate(
                    {
                        name: { $regex: new RegExp(`^${cleanVillage}$`, "i") },
                        mandalId: mandalId,
                        "subagents.username": username,
                        "subagents.password": password,
                        "subagents.token": token
                    },
                    { $set: { "subagents.$.token": newToken } },
                    { new: true } // 'new: true' ensures we get the updated data back
                ).populate({ path: 'mandalId', populate: { path: 'districtId' } });

                if (!result) {
                    return res.status(401).json({ error: "Invalid credentials or Village not found." });
                }

                return res.status(200).json({
                    success: true,
                    message: "Authenticated",
                    data: {
                        villageId: result._id,
                        villageName: result.name,
                        mandalName: result.mandalId?.name,
                        districtName: result.mandalId?.districtId?.name,
                        token: newToken // Return the NEW token for the mobile app to save
                    }
                });
            }
            res.status(400).json({ error: "Invalid role specified." });

        } catch (err) {
            console.error("Auth Error:", err.message);
            res.status(500).json({ error: "Internal server error." });
        }
    });

    app.get("/survey", async (req, res) => {
        try {
            const { district, mandal, village, page = 1, limit = 50 } = req.query;

            // 1. Dynamic Filter
            let filter = {};
            if (district) filter.district = district;
            if (mandal) filter.mandal = mandal;
            if (village) filter.village = village;

            const skip = (parseInt(page) - 1) * parseInt(limit);

            // 2. Run Queries
            const [families, totalRecords, totalsAggregation] = await Promise.all([
                // Paginated Data for the table
                Survey.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),

                // Total count for pagination
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
                totals: totalsAggregation[0] || {}, // This contains the sum of all .value fields
                pagination: {
                    totalRecords,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalRecords / (limit || 1)),
                },
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
    app.use('/api', router);
};