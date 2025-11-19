// api/alert.js
const { connectToDatabase } = require("./db");

module.exports = async (req, res) => {
  // Handle CORS Preflight (Optional but recommended for safety)
  if (req.method === "OPTIONS") {
    return res.status(200).send("OK");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
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

    res.status(201).json({ message: "Alert recorded" });
  } catch (error) {
    console.error("MongoDB Error:", error);
    // Return JSON error, not HTML
    res.status(500).json({ message: "Database error", error: error.message });
  }
};
