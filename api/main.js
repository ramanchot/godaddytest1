import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  try {
    
    // if (req.method !== "POST") {
    //   return res.status(405).json({ error: "Only POST allowed" });
    // }

    const db = (await clientPromise).db("RamanDB");
    const { action, data } = req.body;

    switch (action) {

      case "ADD_PROPERTY":
        const propertyResult = await db.collection("properties").insertOne({
          name: data.name
        });

        return res.json({
          success: true,
          id: propertyResult.insertedId
        });

      case "ADD_TENANT":
        const tenantResult = await db.collection("tenants").insertOne({
          propertyId: data.propertyId,
          name: data.name
        });

      case "GET_RENT_RECORDS_LIST":
        const { month, year } = data; 
        const query = {
          month: Number(month),
          year: Number(year)
        };
        const rentRecords = await db.collection("rentRecords").find(query).toArray();
        return res.json(rentRecords);

      case "UPDATE_RENT_RECORD":
        console.log("Updating rent record...");
        console.log(data.id);
        const rentRecordResult = await db.collection("rentRecords").updateOne(
          { _id: new ObjectId(data.id) },
          { $set: { rentAmount: Number(data.rentAmountRecieved) } }
        );

        //return res.json({
         // success: true,
          //id: tenantResult.insertedId
        //});

      default:
        return res.status(400).json({ error: "Invalid action" });
    }

  } catch (err) {
    console.error("Mongo Error:", err);
    res.status(500).json({ error: err.message });
  }
}