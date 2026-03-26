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
      console.log('Property ID:', req.query.propertyId);
      switch (action) {

        case "GET_RENT_RECORDS_LIST": {
          console.log("Getting rent record...");

          const rentRecords = await db.collection("rentRecords")
            .find({
              propertyId: req.query.propertyId,
              month: Number(month),
              year: Number(year),
              tenantActive: true
            })
            .toArray();
            console.log("Rent records found: "+rentRecords.length);
          
          return res.json(rentRecords);
        }

        case "GET_ALL_TENANTS_LIST": {
          console.log("Getting all tenants list for property..."+req.query.propertyId);

          const tenants = await db.collection("tenants")
            .find({ propertyId: req.query.propertyId })
            .toArray();

          return res.json(tenants);
        }

        case "GET_ACTIVE_TENANTS_LIST": {
          console.log("Getting active tenants list for property..."+req.query.propertyId);

          const tenants = await db.collection("tenants")
            .find({ propertyId: req.query.propertyId,
              isActive: true
             })
            .toArray();

          return res.json(tenants);
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

        case "LOGIN": {
          const user = await db.collection("users").findOne({ username: data.username });
          if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
          }
          if (user.password !== data.password) {
            return res.status(401).json({ error: "Invalid username or password" });
          }
          return res.json({ success: true, user: { id: user._id, username: user.username } });
        }


        case "ADD_PROPERTY": {
          const result = await db.collection("properties").insertOne({
            name: data.name
          });

          return res.json({ success: true, id: result.insertedId });
        }

        case "DELETE_PROPERTY": {
          const result = await db.collection("properties").deleteOne({
            _id: new ObjectId(data.propertyId)
          });

          return res.json({ success: true });
        }

        case "ADD_TENANT": {
          const result = await db.collection("tenants").insertOne({
            propertyId: data.propertyId,
            name: data.name
          });

          return res.json({ success: true, id: result.insertedId });
        }

        case "MARK_TENANT_INACTIVE": {
          const result = await db.collection("tenants").updateOne(
            { _id: new ObjectId(data.tenantId) },
            { $set: { isActive: false } }
          );

          return res.json({ success: true });
        }

        case "UPDATE_RENT_RECORD": {
          const result = await db.collection("rentRecords").updateOne(
            { _id: new ObjectId(data.id) },
            { $set: { rentAmount: Number(data.rentAmountRecieved), rentReceived :data.rentReceived, electricityBill :Number(data.electricityAmount)} },
            
          );

          return res.json({ success: true });
        }

        case "SET_ELECTRICITY_BILL_RECEIVED_FOR_MONTH_AS_TRUE": {
          console.log("Setting electricity bill received for month as true..."+JSON.stringify(data));
          const result = await db.collection("rentRecords").updateMany(
            {
              propertyId: data.propertyId,
              month: data.month,
              year: data.year
            },
            { $set: { isElectricityMonth: data.isElectricityMonth } }
          );
          console.log("Electricity bill received for month updated for records count: "+result.modifiedCount);
          return res.json({ success: true });
        }

        case "INIT_RENT_RECORDS": {
          console.log("Initializing rent records for current month..."+data.records.length);
          const result = await db.collection("rentRecords").insertMany(data.records);
          return res.json({ success: true, message: "Rent records initialization triggered" });
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