import crypto from "crypto";
export const generateRawToken=(bytes=32)=>crypto.randomBytes(bytes).toString("hex");
export const createTokenHash=(raw)=>crypto.createHash("sha256").update(raw).digest("hex");
export const tokenExpiresAt=(hours)=>new Date(Date.now()+hours*60*60*1000);
