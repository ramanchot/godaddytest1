import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  try {
    const { propertyId, month, year } = req.query;

    const db = (await clientPromise).db("RamanDB");

    const list = await db.collection("rentRecords")
      .find({
        propertyId,
        month: Number(month),
        year: Number(year)
      })
      .sort({ tenantName: 1 })
      .toArray();

    res.json(list);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
