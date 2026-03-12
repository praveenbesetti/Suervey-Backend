import fs from "fs";
import path from "path";
import crypto from "crypto";
import ExcelJS from "exceljs";
import { District } from "../model/DistrictSchema.js";
import { Mandal } from "../model/MandalSchema.js";
import { Village } from "../model/VillageSchema.js";

export const setupUniqueHierarchy = async () => {
  try {
    const xlsxFilePath = path.resolve("data.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(xlsxFilePath);
    const sheet = workbook.getWorksheet(1);

    const districtNames = new Set();
    const mandalData = new Map(); // Key: "District|Mandal"
    const villageData = []; // Array of {d, m, v}

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const d = row.getCell(3).value?.toString()?.trim();
      const m = row.getCell(4).value?.toString()?.trim();
      const v = row.getCell(5).value?.toString()?.trim();

      if (d && m && v) {
        districtNames.add(d);
        mandalData.set(`${d.toLowerCase()}|${m.toLowerCase()}`, { d, m });
        villageData.push({ d, m, v });
      }
    });

    // --- 1. Sync Districts ---
    console.log("📂 Syncing Districts...");
    const districtLookup = {};
    for (const dName of districtNames) {
      const doc = await District.findOneAndUpdate(
        { name: dName },
        { $setOnInsert: { name: dName, state: "Andhra Pradesh" } },
        { upsert: true, new: true, lean: true }
      );
      districtLookup[dName.toLowerCase()] = doc._id.toString();
    }

    // --- 2. Sync Mandals (Unique per District) ---
    console.log("👤 Syncing Mandals...");
    const mandalLookup = {};
    const mandalArray = Array.from(mandalData.values());
    
    for (const item of mandalArray) {
      const dId = districtLookup[item.d.toLowerCase()];
      const doc = await Mandal.findOneAndUpdate(
        { name: item.m, districtId: dId },
        { 
          $setOnInsert: { 
            name: item.m, 
            districtId: dId,
            username: `agent_${item.m.toLowerCase().replace(/\s/g, '')}_${crypto.randomBytes(2).toString('hex')}`,
            password: crypto.randomBytes(4).toString('hex')
          } 
        },
        { upsert: true, new: true, lean: true }
      );
      mandalLookup[`${item.d.toLowerCase()}|${item.m.toLowerCase()}`] = doc._id.toString();
    }

    // --- 3. Sync Villages (Unique per Mandal) ---
    console.log("🚀 Syncing all 10,605 Villages...");
    const villageOps = villageData.map((item) => {
      const mId = mandalLookup[`${item.d.toLowerCase()}|${item.m.toLowerCase()}`];
      if (!mId) return null;

      return {
        updateOne: {
          filter: { name: item.v, mandalId: mId },
          update: {
            $setOnInsert: {
              name: item.v,
              mandalId: mId,
              subagents: [{
                username: `sub_${item.v.toLowerCase().replace(/\s+/g, '')}_${crypto.randomBytes(2).toString('hex')}`,
                password: crypto.randomBytes(4).toString('hex'),
                token: crypto.randomBytes(3).toString('hex').toUpperCase(),
                count: 0,
                isAuthorized: false
              }]
            }
          },
          upsert: true
        }
      };
    }).filter(Boolean);

    // Batch execute to prevent terminal crash
    for (let i = 0; i < villageOps.length; i += 1000) {
      await Village.bulkWrite(villageOps.slice(i, i + 1000), { ordered: false });
      process.stdout.write(`\r📊 Progress: ${Math.min(i + 1000, villageOps.length)} / ${villageOps.length}`);
    }

    console.log("\n🏆 SUCCESS: Hierarchical sync complete!");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ Fatal Error:", error.message);
  }
};
export const checkDuplicates = async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('data.xlsx');
    const sheet = workbook.getWorksheet(1);
    
    const seenNames = new Set();
    const duplicates = [];

    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const vName = row.getCell(5).value?.toString()?.trim();
        
        if (seenNames.has(vName)) {
            duplicates.push({ row: rowNumber, name: vName });
        } else {
            seenNames.add(vName);
        }
    });

    console.log(`Total Rows: ${sheet.rowCount - 1}`);
    console.log(`Unique Names: ${seenNames.size}`);
    console.log(`Duplicate Names Found: ${duplicates.length}`);
    console.log("First 5 duplicates:", duplicates.slice(0, 5));
};