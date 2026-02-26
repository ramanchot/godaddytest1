import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();
console.log("Mongo URI:", process.env.MONGODB_URI);

export default async function handler(req, res) {
  try {
    console.log("METHOD:", req.method);
    console.log("BODY:", req.body);
    //let body = "";
    //for await (const c of req) body += c;
    //const data = JSON.parse(body);
    const data = req.body;
    const db = (await clientPromise).db("RamanDB");

    const result = await db.collection("properties").insertOne({
      name: data.name
    });

    res.json({ success: true, id: result.insertedId });

  } catch (err) {
    console.error("Mongo Insert Error:", err);
    res.status(500).json({ error: err.message });
  }
}
