const { MongoClient } = require("mongodb");

let client;
let dbConnection;

async function connectToDatabase() {
  // 1. Return cached connection if available
  if (dbConnection) {
    return dbConnection;
  }

  // 2. Safety check for the environment variable
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  // 3. Create a new client only if one doesn't exist
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
