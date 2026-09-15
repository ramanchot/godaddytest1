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

    const client = await clientPromise;
    const db = client.db("RamanDB");
    
    // --------------------------------------------------
    // GET PROPERTIES
    // --------------------------------------------------

    async function getProperties() {

      const properties = await db.collection("properties")
        .find({})
        .toArray();

      return properties.map(property => ({
        name: property.name,
        id: property._id.toString()
      }));
    }


    // --------------------------------------------------
    // GET RENT SUMMARY
    // --------------------------------------------------

    async function getRentSummary(propertyName, month, year) {

      const property = await db.collection("properties").findOne({
        name: {
          $regex: `^${propertyName.trim()}$`,
          $options: "i"
        }
      });

      if (!property) {
        return {
          error: `Property "${propertyName}" was not found.`
        };
      }

      const propertyId = property._id.toString();

      const records = await db.collection("rentRecords")
        .find({
          propertyId,
          month: Number(month),
          year: Number(year),
          tenantActive: true
        })
        .toArray();


      // Calculate totals HERE on the server

      let rentDue = 0;
      let rentReceived = 0;
      let rentPending = 0;

      let receivedCount = 0;
      let pendingCount = 0;


      for (const record of records) {

        const amount = Number(record.rentAmount || 0);

        rentDue += amount;

        if (record.rentReceived === true) {

          rentReceived += amount;
          receivedCount++;

        } else {

          rentPending += amount;
          pendingCount++;

        }

      }


      const collectionRate =
        rentDue > 0
          ? Number(((rentReceived / rentDue) * 100).toFixed(2))
          : 0;


      return {

        propertyName: property.name,

        month: Number(month),

        year: Number(year),

        activeTenants: records.length,

        rentDue,

        rentReceived,

        rentPending,

        receivedCount,

        pendingCount,

        collectionRate

      };

    }


    // --------------------------------------------------
    // AI TOOLS
    // --------------------------------------------------

    const tools = [

      {
        type: "function",

        name: "get_properties",

        description:
          "Get the list of properties available in the property management system.",

        parameters: {

          type: "object",

          properties: {},

          additionalProperties: false

        }

      },


      {

        type: "function",

        name: "get_rent_summary",

        description:
          "Get the calculated rent summary for a property and month. This is read-only.",

        parameters: {

          type: "object",

          properties: {

            propertyName: {

              type: "string",

              description:
                "Property name such as A94"

            },

            month: {

              type: "integer",

              description:
                "Month number from 1 to 12"

            },

            year: {

              type: "integer",

              description:
                "Four digit year"

            }

          },

          required: [
            "propertyName",
            "month",
            "year"
          ],

          additionalProperties: false

        }

      }

    ];


    // --------------------------------------------------
    // AI INSTRUCTIONS
    // --------------------------------------------------

    const instructions = `

You are the Rent Assistant for a property management system.

You have READ-ONLY access to rent information.

You cannot modify the database.

You cannot add, delete, update, mark or change anything.

IMPORTANT:

When the user asks about rent:

1. Identify the property.
2. Identify the month and year.
3. Call get_rent_summary.
4. Use the returned numbers exactly.
5. NEVER invent numbers.
6. NEVER omit the actual amounts from a rent summary.

When displaying a rent summary, ALWAYS show:

Property
Month
Active tenants
Rent due
Rent received
Rent pending
Paid tenants
Pending tenants
Collection rate

Use Indian Rupee formatting.

For example:

A94 — September 2026

Active tenants: 10
Rent due: ₹125,000
Rent received: ₹100,000
Rent pending: ₹25,000

Paid tenants: 8
Pending tenants: 2

Collection rate: 80%

Property names should be used instead of MongoDB IDs.

If the user doesn't provide a month/year and it is required, ask them for it.

`;


    // --------------------------------------------------
    // FIRST AI REQUEST
    // --------------------------------------------------

    let response = await openai.responses.create({

      model: "gpt-5.6-luna",

      instructions,

      input: message,

      tools

    });


    // --------------------------------------------------
    // HANDLE TOOL CALLS
    // --------------------------------------------------

    while (true) {

      const toolCalls = response.output.filter(
        item => item.type === "function_call"
      );


      if (toolCalls.length === 0) {
        break;
      }


      const toolOutputs = [];


      for (const toolCall of toolCalls) {

        const args = JSON.parse(toolCall.arguments);

        let result;


        if (toolCall.name === "get_properties") {

          result = await getProperties();

        }


        else if (toolCall.name === "get_rent_summary") {

          result = await getRentSummary(

            args.propertyName,

            args.month,

            args.year

          );

        }


        else {

          result = {
            error: "Unknown tool"
          };

        }


        toolOutputs.push({

          type: "function_call_output",

          call_id: toolCall.call_id,

          output: JSON.stringify(result)

        });

      }


      // Send calculated database result back to AI

      response = await openai.responses.create({

        model: "gpt-5.6-luna",

        instructions,

        previous_response_id: response.id,

        input: toolOutputs,

        tools

      });

    }


    // --------------------------------------------------
    // RETURN ANSWER
    // --------------------------------------------------

    return res.status(200).json({

      answer: response.output_text

    });


  }

  catch (error) {

    console.error("Agent error:", error);

    return res.status(500).json({

      error: "Unable to process the request.",

      details: error.message

    });

  }

}