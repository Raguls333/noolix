import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.titan.email",
  port: 587,
  secure: false,       // MUST be false
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER, // full email address
    pass: process.env.SMTP_PASS, // mailbox password ONLY
  },
});

try {
  await transporter.verify();
  console.log("✅ TITAN SMTP WORKS");
} catch (e) {
  console.error("❌ TITAN SMTP FAIL:", e?.response || e?.message || e);
}
