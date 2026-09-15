import { createMcpHandler } from "@modelcontextprotocol/server";
import { z } from "zod";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "get_rent_summary",
      "Get the rent summary for a property and month.",
      {
        propertyName: z.string().describe("Property name, for example A94"),
        month: z.number().int().min(1).max(12).describe("Month number, 1 to 12"),
        year: z.number().int().describe("Year, for example 2026")
      },
      async ({ propertyName, month, year }) => {
        try {
          const client = await clientPromise;
          const db = client.db("RamanDB");

          // Find the property by name
          const property = await db.collection("properties").findOne({
            name: {
              $regex: `^${propertyName.trim()}$`,
              $options: "i"
            }
          });

          if (!property) {
            return {
              content: [
                {
                  type: "text",
                  text: `Property "${propertyName}" was not found.`
                }
              ]
            };
          }

          const propertyId = property._id.toString();

          // Get rent records for the property/month/year
          const records = await db.collection("rentRecords")
            .find({
              propertyId,
              month: Number(month),
              year: Number(year),
              tenantActive: true
            })
            .toArray();

          const rentDue = records.reduce(
            (total, record) => total + Number(record.rentAmount || 0),
            0
          );

          const receivedRecords = records.filter(
            record => record.rentReceived === true
          );

          const pendingRecords = records.filter(
            record => record.rentReceived !== true
          );

          const rentReceived = receivedRecords.reduce(
            (total, record) => total + Number(record.rentAmount || 0),
            0
          );

          const rentPending = pendingRecords.reduce(
            (total, record) => total + Number(record.rentAmount || 0),
            0
          );

          const collectionRate =
            rentDue > 0
              ? Number(((rentReceived / rentDue) * 100).toFixed(2))
              : 0;

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  propertyName: property.name,
                  propertyId,
                  month,
                  year,
                  totalTenants: records.length,
                  rentDue,
                  rentReceived,
                  rentPending,
                  receivedCount: receivedRecords.length,
                  pendingCount: pendingRecords.length,
                  collectionRate
                })
              }
            ]
          };

        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting rent summary: ${error.message}`
              }
            ],
            isError: true
          };
        }
      }
    );
  },
  {
    serverInfo: {
      name: "rent-tracker-mcp",
      version: "1.0.0"
    }
  },
  {
    basePath: "/api"
  }
);

export default handler;