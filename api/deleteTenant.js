import { MongoClient, ObjectId } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  const id = req.query.id;

  const db = (await clientPromise).db("RamanDB");
  await db.collection("tenants").deleteOne({ _id: new ObjectId(id) });

  res.json({ success: true });
}
