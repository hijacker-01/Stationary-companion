const GSTStateMaster = require("../models/GSTStateMaster");

const INDIAN_STATES = [
  { stateCode: "01", stateName: "Jammu and Kashmir", zoneClassification: "North", isUnionTerritory: true },
  { stateCode: "02", stateName: "Himachal Pradesh", zoneClassification: "North", isUnionTerritory: false },
  { stateCode: "03", stateName: "Punjab", zoneClassification: "North", isUnionTerritory: false },
  { stateCode: "04", stateName: "Chandigarh", zoneClassification: "North", isUnionTerritory: true },
  { stateCode: "05", stateName: "Uttarakhand", zoneClassification: "North", isUnionTerritory: false },
  { stateCode: "06", stateName: "Haryana", zoneClassification: "North", isUnionTerritory: false },
  { stateCode: "07", stateName: "Delhi", zoneClassification: "North", isUnionTerritory: true },
  { stateCode: "08", stateName: "Rajasthan", zoneClassification: "North", isUnionTerritory: false },
  { stateCode: "09", stateName: "Uttar Pradesh", zoneClassification: "North", isUnionTerritory: false },
  { stateCode: "10", stateName: "Bihar", zoneClassification: "East", isUnionTerritory: false },
  { stateCode: "11", stateName: "Sikkim", zoneClassification: "North-East", isUnionTerritory: false },
  { stateCode: "12", stateName: "Arunachal Pradesh", zoneClassification: "North-East", isUnionTerritory: false },
  { stateCode: "13", stateName: "Nagaland", zoneClassification: "North-East", isUnionTerritory: false },
  { stateCode: "14", stateName: "Manipur", zoneClassification: "North-East", isUnionTerritory: false },
  { stateCode: "15", stateName: "Mizoram", zoneClassification: "North-East", isUnionTerritory: false },
  { stateCode: "16", stateName: "Tripura", zoneClassification: "North-East", isUnionTerritory: false },
  { stateCode: "17", stateName: "Meghalaya", zoneClassification: "North-East", isUnionTerritory: false },
  { stateCode: "18", stateName: "Assam", zoneClassification: "North-East", isUnionTerritory: false },
  { stateCode: "19", stateName: "West Bengal", zoneClassification: "East", isUnionTerritory: false },
  { stateCode: "20", stateName: "Jharkhand", zoneClassification: "East", isUnionTerritory: false },
  { stateCode: "21", stateName: "Odisha", zoneClassification: "East", isUnionTerritory: false },
  { stateCode: "22", stateName: "Chhattisgarh", zoneClassification: "Central", isUnionTerritory: false },
  { stateCode: "23", stateName: "Madhya Pradesh", zoneClassification: "Central", isUnionTerritory: false },
  { stateCode: "24", stateName: "Gujarat", zoneClassification: "West", isUnionTerritory: false },
  { stateCode: "26", stateName: "Dadra and Nagar Haveli and Daman and Diu", zoneClassification: "West", isUnionTerritory: true },
  { stateCode: "27", stateName: "Maharashtra", zoneClassification: "West", isUnionTerritory: false },
  { stateCode: "29", stateName: "Karnataka", zoneClassification: "South", isUnionTerritory: false },
  { stateCode: "30", stateName: "Goa", zoneClassification: "West", isUnionTerritory: false },
  { stateCode: "31", stateName: "Lakshadweep", zoneClassification: "South", isUnionTerritory: true },
  { stateCode: "32", stateName: "Kerala", zoneClassification: "South", isUnionTerritory: false },
  { stateCode: "33", stateName: "Tamil Nadu", zoneClassification: "South", isUnionTerritory: false },
  { stateCode: "34", stateName: "Puducherry", zoneClassification: "South", isUnionTerritory: true },
  { stateCode: "35", stateName: "Andaman and Nicobar Islands", zoneClassification: "South", isUnionTerritory: true },
  { stateCode: "36", stateName: "Telangana", zoneClassification: "South", isUnionTerritory: false },
  { stateCode: "37", stateName: "Andhra Pradesh", zoneClassification: "South", isUnionTerritory: false },
  { stateCode: "38", stateName: "Ladakh", zoneClassification: "North", isUnionTerritory: true }
];

async function seedStateMaster() {
  try {
    const count = await GSTStateMaster.count();
    if (count === 0) {
      console.log("Seeding GST State Master...");
      await GSTStateMaster.bulkCreate(INDIAN_STATES);
      console.log(`✅ Seeded ${INDIAN_STATES.length} States/UTs`);
    } else {
      console.log(`✅ GST State Master already seeded (${count} states)`);
    }
  } catch (err) {
    console.error("Error seeding GST State Master:", err.message);
  }
}

module.exports = { seedStateMaster };
