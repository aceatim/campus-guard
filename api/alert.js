// api/alert.js (Handles POST /api/alert)
const { connectToDatabase } = require("./db");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { location, riskType } = req.body;

  try {
    const db = await connectToDatabase();
    const alertsCollection = db.collection("alerts");

    const newAlert = {
      timestamp: new Date().toISOString(),
      location: location || "Unknown",
      riskType: riskType || "Unspecified",
      status: "Unacknowledged",
    };

    await alertsCollection.insertOne(newAlert);

    // 201 Created status
    res.status(201).json({ message: "Alert recorded" });
  } catch (error) {
    console.error("MongoDB Error:", error);
    res.status(500).json({ message: "Database error" });
  }
};
