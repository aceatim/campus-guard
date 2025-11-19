// api/acknowledge.js (Handles POST /api/acknowledge/:id)
const { connectToDatabase } = require("./db");
const { ObjectId } = require("mongodb");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // The alert ID is passed in the URL path (e.g., /api/acknowledge/60e...)
  // Vercel routes often expose the path segments.
  const pathSegments = req.url.split("/").filter((s) => s.length > 0);
  const alertId = pathSegments[pathSegments.length - 1];

  try {
    // We must validate that the ID is a valid MongoDB ObjectId before querying.
    if (!ObjectId.isValid(alertId)) {
      return res.status(400).json({ message: "Invalid Alert ID format." });
    }

    const db = await connectToDatabase();
    const alertsCollection = db.collection("alerts");

    // Use updateOne to change the 'status' field for the matching document ID.
    const result = await alertsCollection.updateOne(
      { _id: new ObjectId(alertId) }, // Query: Find by MongoDB's unique _id
      { $set: { status: "Acknowledged" } } // Update: Set the status field
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Alert not found." });
    }

    // 200 OK status indicates successful update
    res.status(200).json({ message: "Alert acknowledged successfully" });
  } catch (error) {
    console.error("MongoDB Error during acknowledgment:", error);
    res.status(500).json({ message: "Database error" });
  }
};
