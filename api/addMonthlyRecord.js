import { MongoClient } from "mongodb";
const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  try {
    let body = "";
    for await (const c of req) body += c;
    const data = JSON.parse(body);

    const { propertyId, month, year } = data;

    const db = (await clientPromise).db("RamanDB");

    // 1. Get all tenants under property
    const tenants = await db.collection("tenants").find({ propertyId }).toArray();

    let created = 0;

    // 2. Loop through all tenants and create monthly record if missing
    for (const t of tenants) {
      const exists = await db.collection("rentRecords").findOne({
        tenantId: t._id.toString(),
        month,
        year
      });

      if (!exists) {
        await db.collection("rentRecords").insertOne({
          tenantId: t._id.toString(),
          tenantName: t.name,
          propertyId,
          month,
          year,
          rentAmount: t.rentAmount,
          rentReceived: false,
          electricityBill: null,
          electricityPaid: false
        });

        created++;
      }
    }

    res.json({ success: true, created });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
