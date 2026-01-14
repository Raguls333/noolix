import dotenv from "dotenv";
dotenv.config();
function required(name){ if(!process.env[name]) throw new Error(`Missing required env variable: ${name}`); return process.env[name]; }
export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 8080),
  mongoUri: required("MONGO_URI"),
  jwtSecret: required("JWT_SECRET"),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:5173",
  enablePremium: String(process.env.ENABLE_PREMIUM || "false").toLowerCase()==="true",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  tokenTtlHours: Number(process.env.TOKEN_TTL_HOURS || 168),
};
