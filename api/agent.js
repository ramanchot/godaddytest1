import OpenAI from "openai";
import { MongoClient } from "mongodb";

const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY
});

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export default async function handler(req, res) {
  // Allow only POST
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

    /*
     * READ-ONLY DATABASE FUNCTIONS
     *
     * The AI cannot insert, update or delete anything.
     */

    async function getProperties() {
      return await db.collection("properties")
        .find({})
        .toArray();
    }

    async function getRentRecords(propertyName, month, year) {
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
        .sort({ tenantName: 1 })
        .toArray();

      return {
        propertyName: property.name,
        propertyId,
        month: Number(month),
        year: Number(year),
        records
      };
    }

    const tools = [
      {
        type: "function",
        name: "get_properties",
        description:
          "Get the list of properties and their names. Use this when the user asks about properties or when you need to identify a property name.",
        parameters: {
          type: "object",
          properties: {},
          additionalProperties: false
        }
      },
      {
        type: "function",
        name: "get_rent_records",
        description:
          "Get active tenant rent records for a specific property, month and year. This is read-only.",
        parameters: {
          type: "object",
          properties: {
            propertyName: {
              type: "string",
              description: "Property name, for example A94"
            },
            month: {
              type: "integer",
              description: "Month number from 1 to 12"
            },
            year: {
              type: "integer",
              description: "Four digit year, for example 2026"
            }
          },
          required: ["propertyName", "month", "year"],
          additionalProperties: false
        }
      }
    ];

    const instructions = `
You are the Rent Assistant for a property management system.

You have READ-ONLY access to property and rent information.

IMPORTANT:
- Never claim that you changed, added, deleted, updated or marked anything.
- You cannot modify the database.
- You can only retrieve and summarize information.
- Use property names such as "A94", not MongoDB IDs, when communicating with the user.
- If the user asks for a rent summary, calculate it from the returned rent records.
- Only include active tenants in rent summaries.
- rentReceived=true means the rent has been received.
- rentReceived=false means the rent is pending.
- rentAmount is the amount of rent due for that tenant.
- Be concise but helpful.
- Use Indian Rupee formatting when displaying money.
- If the user does not specify a month/year and it is necessary, ask them for it.
`;

    let response = await openai.responses.create({
      model: "gpt-5.6-luna",
      instructions,
      input: message,
      tools
    });

    /*
     * Handle tool calls
     */
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
          const properties = await getProperties();

          result = properties.map(property => ({
            id: property._id.toString(),
            name: property.name
          }));
        }

        else if (toolCall.name === "get_rent_records") {
          result = await getRentRecords(
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

      response = await openai.responses.create({
        model: "gpt-5.6-luna",
        instructions,
        previous_response_id: response.id,
        input: toolOutputs,
        tools
      });
    }

    return res.status(200).json({
      answer: response.output_text
    });

  } catch (error) {
    console.error("Agent error:", error);

    return res.status(500).json({
      error: "Unable to process the request.",
      details: error.message
    });
  }
}
