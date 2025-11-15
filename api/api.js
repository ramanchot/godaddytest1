import { MongoClient } from "mongodb";

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(process.env.MONGODB_URI);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("RamanDB");
    const collection = db.collection("A94");

    const result = await collection.insertOne(req.body);

    return res.status(200).json({
      success: true,
      id: result.insertedId
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
