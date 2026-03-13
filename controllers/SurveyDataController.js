import Survey from '../models/SurveySchema.js';

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