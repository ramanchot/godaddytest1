//import dotenv from "dotenv";
//dotenv.config({ path: ".env.local" }); uncomment for local testing, comment out for production since main.js already loads env variables
import jwt from "jsonwebtoken";

export default function handler(req, res) {
  const cookie = req.headers.cookie || "";

  const token = cookie
    .split("; ")
    .find(row => row.startsWith("token="))
    ?.split("=")[1];
  console.log("Token found: " + token);
  if (!token) return res.status(401).end();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).end();
  }
}