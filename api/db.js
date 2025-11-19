// api/db.js
const { MongoClient } = require("mongodb");

// Replace with your connection string
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let dbConnection;

async function connectToDatabase() {
  if (dbConnection) {
    return dbConnection;
  }
  await client.connect();
  // Specify the database name (e.g., 'campusguard_db')
  dbConnection = client.db("campusguard_db");
  return dbConnection;
}

module.exports = {
  connectToDatabase,
};
