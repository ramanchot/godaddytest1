import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export async function initMonthlyRentRecords() {
  const db = (await clientPromise).db("RamanDB");

  const now = new Date();
  const month = now.getMonth() + 1; // 1–12
  const year = now.getFullYear();

  const rentCollection = db.collection("rentRecords");

  /**
   * STEP 1: Get all active tenants
   * (assuming tenants collection exists)
   */
  const tenants = await db.collection("tenants").find({}).toArray();

  if (!tenants.length) {
    console.log("No tenants found");
    return;
  }

  const recordsToInsert = [];

  for (const tenant of tenants) {
    // Check if record already exists for this month
    const exists = await rentCollection.findOne({
      tenantId: tenant._id.toString(),
      propertyId: tenant.propertyId,
      month,
      year
    });

    if (exists) continue;

    recordsToInsert.push({
      tenantId: tenant._id.toString(),
      tenantName: tenant.name,
      propertyId: tenant.propertyId,
      month,
      year,
      rentAmount: tenant.rentAmount,
      rentReceived: false,
      electricityBill: null,
      electricityPaid: false,
      createdAt: new Date()
    });
  }

  if (!recordsToInsert.length) {
    console.log("Rent records already exist for", month, year);
    return;
  }

  await rentCollection.insertMany(recordsToInsert);

  console.log(`Created ${recordsToInsert.length} rent records for ${month}/${year}`);
}
