import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  try {
    const db = (await clientPromise).db("RamanDB");

    // ==========================
    // HANDLE GET REQUESTS
    // ==========================
    if (req.method === "GET") {
      console.log("Handling GET request..."+JSON.stringify(req.query));
      const { action, month, year } = req.query;

      switch (action) {

        case "GET_RENT_RECORDS_LIST": {
          console.log("Getting rent record...");

          const rentRecords = await db.collection("rentRecords")
            .find({
              month: Number(month),
              year: Number(year)
            })
            .toArray();

          return res.json(rentRecords);
        }

        default:
          return res.status(400).json({ error: "Invalid GET action" });
      }
    }

    // ==========================
    // HANDLE POST REQUESTS
    // ==========================
    if (req.method === "POST") {
      const { action, data } = req.body;

      switch (action) {

        case "ADD_PROPERTY": {
          const result = await db.collection("properties").insertOne({
            name: data.name
          });

          return res.json({ success: true, id: result.insertedId });
        }

        case "ADD_TENANT": {
          const result = await db.collection("tenants").insertOne({
            propertyId: data.propertyId,
            name: data.name
          });

          return res.json({ success: true, id: result.insertedId });
        }

        case "UPDATE_RENT_RECORD": {
          const result = await db.collection("rentRecords").updateOne(
            { _id: new ObjectId(data.id) },
            { $set: { rentAmount: Number(data.rentAmountRecieved) } }
          );

          return res.json({ success: true });
        }

        default:
          return res.status(400).json({ error: "Invalid POST action" });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("Mongo Error:", err);
    res.status(500).json({ error: err.message });
  }
}