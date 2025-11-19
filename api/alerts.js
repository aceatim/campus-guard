// api/alerts.js (Handles GET /api/alerts)
const { connectToDatabase } = require("./db");
const { ObjectId } = require("mongodb"); // ObjectId is needed for MongoDB ID management

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const db = await connectToDatabase();
    const alertsCollection = db.collection("alerts");

    // Retrieve all alerts.
    // Use .sort({ timestamp: -1 }) to ensure the newest alerts appear first,
    // matching the order expected by the Vue dashboard component.
    const alerts = await alertsCollection
      .find({})
      .sort({ timestamp: -1 })
      .toArray();

    // Map the MongoDB documents to ensure compatibility with frontend's expectations.
    // The frontend expects the 'id' field, so we map '_id' to 'id'.
    const formattedAlerts = alerts.map((alert) => ({
      id: alert._id.toString(), // Convert MongoDB ObjectId to string for the frontend
      timestamp: alert.timestamp,
      location: alert.location,
      riskType: alert.riskType,
      status: alert.status,
    }));

    res.status(200).json(formattedAlerts);
  } catch (error) {
    console.error("MongoDB Error during alert fetch:", error);
    res.status(500).json({ message: "Database error" });
  }
};
