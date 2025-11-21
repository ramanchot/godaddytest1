import { MongoClient, ObjectId } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  try {
    let body = "";
    for await (const c of req) body += c;
    const data = JSON.parse(body);

    const { id, rentReceived } = data;

    const db = (await clientPromise).db("RamanDB");

    await db.collection("rentRecords").updateOne(
      { _id: new ObjectId(id) },
      { $set: { rentReceived } }
    );

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
