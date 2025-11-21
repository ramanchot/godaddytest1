import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  const db = (await clientPromise).db("RamanDB");
  const list = await db.collection("properties").find({}).toArray();
  res.json(list);
}
