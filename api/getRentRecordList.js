import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  try {
    
    
    const { month, year } = req.query; 
    /*const query={month:2, year:2025};*/
    const query = {
      month: Number(month),
      year: Number(year)
    };
    const db = (await clientPromise).db("RamanDB");
    const list = await db.collection("rentRecords").find(query).toArray();
    res.json(list);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
