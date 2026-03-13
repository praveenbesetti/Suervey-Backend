import { Mandal } from '../models/MandalSchema.js';

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

// Ensure 'res' is the second argument!
export const getAgentDetailsByDistrict = async (req, res) => {
    
       try {
        const mandals = await Mandal.find({ districtId: req.params.districtId })

        res.json(mandals);
    }catch (err) {
        // The check for 'res' prevents the crash you saw earlier
        if (res) {
            res.status(500).json({ error: err.message });
        }
    }
};

export const updateMandalAgent = async (req, res) => {
    try {
        const { mandalId } = req.params;
        const { agentname, phone, username, password } = req.body;

        const updatedMandal = await Mandal.findByIdAndUpdate(
            mandalId,
            { 
                $set: { 
                    agentname, 
                    phone, 
                    username, 
                    password 
                } 
            },
            { new: true }
        );

        res.json({ success: true, data: updatedMandal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};