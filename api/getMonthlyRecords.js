import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  const { propertyId } = req.query;

  const db = (await clientPromise).db("RamanDB");
  const list = await db.collection("rentRecords")
    .find({ propertyId })
    .sort({ year: -1, month: -1 })
    .toArray();

  res.json(list);
}
