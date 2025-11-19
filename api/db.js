// api/db.js
const { MongoClient } = require("mongodb");

let client;
let dbConnection;

async function connectToDatabase() {
  if (dbConnection) {
    return dbConnection;
  }

  // CRITICAL: Check if the variable exists before using it
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  // Only create the client if it doesn't exist
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
  }

  dbConnection = client.db("campusguard_db");
  return dbConnection;
}

module.exports = {
  connectToDatabase,
};
