import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  let body = "";
  for await (const c of req) body += c;
  const data = JSON.parse(body);

  const db = (await clientPromise).db("RamanDB");

  const doc = {
    propertyId: data.propertyId,
    name: data.name,
    rentAmount: Number(data.rentAmount),
    electricityBillMonthCycle: Number(data.electricityBillMonthCycle)
  };

  const result = await db.collection("tenants").insertOne(doc);

  res.json({ success: true, id: result.insertedId });
}
