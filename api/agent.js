import OpenAI from "openai";
import { MongoClient } from "mongodb";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY
});

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Message is required"
      });
    }

    const db = (await clientPromise).db("RamanDB");

    // --------------------------------------------------
    // GET ALL PROPERTY NAMES
    // --------------------------------------------------

    const properties = await db.collection("properties")
      .find({}, {
        projection: {
          name: 1
        }
      })
      .toArray();


    const propertyNames = properties
      .map(p => p.name)
      .filter(Boolean);


    // --------------------------------------------------
    // ASK AI TO IDENTIFY PROPERTY / MONTH / YEAR
    // --------------------------------------------------

    const extractionResponse = await openai.responses.create({

      model: "gpt-5.6-luna",

      instructions: `
You extract information from rent-management questions.

Available property names:

${propertyNames.join(", ")}

From the user's question, identify:

- propertyName
- month number
- year

Return ONLY valid JSON in this exact format:

{
  "propertyName": "A94",
  "month": 9,
  "year": 2026
}

If the property, month, or year cannot be determined, use null.

Do not calculate anything.
Do not invent property names.
`,

      input: message

    });


    let extracted;

    try {

      extracted = JSON.parse(
        extractionResponse.output_text
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()
      );

    } catch {

      return res.status(200).json({
        answer:
          "I couldn't determine the property, month, or year from your question. Please specify them."
      });

    }


    const propertyName = extracted.propertyName;
    const month = Number(extracted.month);
    const year = Number(extracted.year);


    // --------------------------------------------------
    // VALIDATE INPUT
    // --------------------------------------------------

    if (
      !propertyName ||
      !month ||
      !year ||
      month < 1 ||
      month > 12
    ) {

      return res.status(200).json({
        answer:
          "Please specify the property, month and year. For example: \"Give me the rent summary for A94 for September 2026.\""
      });

    }


    // --------------------------------------------------
    // FIND PROPERTY
    // --------------------------------------------------

    const property = await db.collection("properties").findOne({

      name: {
        $regex: `^${propertyName.trim()}$`,
        $options: "i"
      }

    });


    if (!property) {

      return res.status(200).json({

        answer:
          `I couldn't find a property named "${propertyName}".`

      });

    }


    const propertyId = property._id.toString();


    // --------------------------------------------------
    // GET ACTIVE RENT RECORDS
    // --------------------------------------------------

    const records = await db.collection("rentRecords")

      .find({

        propertyId,
        month,
        year,
        tenantActive: true

      })

      .toArray();


    // --------------------------------------------------
    // CALCULATE RENT SUMMARY
    // --------------------------------------------------

let rentDue = 0;
let rentReceived = 0;
let rentPending = 0;

let receivedCount = 0;
let pendingCount = 0;

const pendingTenants = [];


    for (const record of records) {

      const amount = Number(record.rentAmount || 0);

      rentDue += amount;


      if (record.rentReceived === true) {

        rentReceived += amount;
        receivedCount++;

      } else {

      rentPending += amount;
      pendingCount++;

      pendingTenants.push({
        tenantName: record.tenantName,
        rentAmount: amount
      });

    }

    }


    const collectionRate =

      rentDue > 0

        ? Number(
            ((rentReceived / rentDue) * 100).toFixed(2)
          )

        : 0;


    // --------------------------------------------------
    // VERIFIED DATA
    // --------------------------------------------------

    const verifiedData = {

  property: property.name,

  month,
  year,

  activeTenants: records.length,

  rentDue,

  rentReceived,

  rentPending,

  paidTenants: receivedCount,

  pendingTenants: pendingCount,

  collectionRate,

  pendingTenantDetails: pendingTenants

};


    console.log(
      "Verified rent data:",
      JSON.stringify(verifiedData)
    );


    // --------------------------------------------------
    // ASK AI TO PRESENT VERIFIED DATA
    // --------------------------------------------------

    const finalResponse = await openai.responses.create({

      model: "gpt-5.6-luna",

      instructions: `

You are a rent management assistant.

The following information has been calculated directly from the database:

${JSON.stringify(verifiedData)}

This data is VERIFIED.

You MUST use these exact numbers.

Do NOT calculate different numbers.
Do NOT invent numbers.
Do NOT omit the amounts.

Answer the user's question clearly.

For a rent summary, show:

Property
Month
Active tenants
Rent due
Rent received
Rent pending
Paid tenants
Pending tenants
Collection rate

Use Indian Rupee formatting such as ₹12,500.

You have READ-ONLY access.
You cannot change anything in the database.

If there are pending tenants, also show their names and rent amounts.

If a tenant is marked pending but their rent amount is ₹0, explicitly mention that their status is pending but there is ₹0 rent pending for them.

`,

      input: message

    });


    // --------------------------------------------------
    // RETURN ANSWER
    // --------------------------------------------------

    return res.status(200).json({

      answer: finalResponse.output_text,

  

    });


  } catch (error) {

    console.error("Agent error:", error);

    return res.status(500).json({

      error: "Unable to process the request.",

      details: error.message

    });

  }

}