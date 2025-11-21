import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  try {
    const propertyId = req.query.propertyId;

    const db = (await clientPromise).db("RamanDB");
    const list = await db.collection("tenants")
      .find({ propertyId })
      .toArray();

    res.json(list);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
