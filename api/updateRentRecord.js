import { MongoClient, ObjectId } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  try {
    let body = "";
    for await (const c of req) body += c;
    const data = JSON.parse(body);

    const db = (await clientPromise).db("RamanDB");

    const result = await db.collection("rentRecords").updateOne(
        /* _id: new ObjectId(data.id),*/
        { month: Number(data.month) },  
        { $set: { rentAmount: data.rentAmount }}
    );

    res.json({ success: true, matched: result.matchedCount,
      modified: result.modifiedCount});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
