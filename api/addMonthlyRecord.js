import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  let body = "";
  for await (const c of req) body += c;
  const data = JSON.parse(body);

  const db = (await clientPromise).db("RamanDB");

  const record = {
    propertyId: data.propertyId,
    month: data.month,
    year: data.year,
    rentAmount: 0,
    rentReceived: false,
    electricityBill: null,
    electricityPaid: false
  };

  const result = await db.collection("rentRecords").insertOne(record);
  res.json({ success: true, id: result.insertedId });
}
