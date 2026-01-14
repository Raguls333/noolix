import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { Organization } from "../src/models/Organization.model.js";
import { User } from "../src/models/User.model.js";
import { Client } from "../src/models/Client.model.js";
import { Commitment } from "../src/models/Commitment.model.js";
import { ROLES } from "../src/constants/roles.js";
import { PLANS } from "../src/constants/plans.js";

const ORG_NAME = "NOOLIX Demo Org";
const FOUNDER_EMAIL = "founder@noolix.dev";
const FOUNDER_PASSWORD = "ChangeMe123!";
const CLIENT_EMAIL = "client@acme.com";
const COMMITMENT_TITLE = "Sample Commitment";

await mongoose.connect(env.mongoUri);

try {
  let org = await Organization.findOne({ name: ORG_NAME });
  if (!org) {
    org = await Organization.create({
      name: ORG_NAME,
      contactEmail: FOUNDER_EMAIL.toLowerCase(),
      timezone: "Asia/Kolkata",
      currency: "INR",
      plan: PLANS.AGENCY,
      planStatus: "ACTIVE",
    });
  }

  const founderEmail = FOUNDER_EMAIL.toLowerCase();
  let founder = await User.findOne({ orgId: org._id, email: founderEmail });
  if (!founder) {
    founder = await User.create({
      orgId: org._id,
      name: "Founder",
      email: founderEmail,
      passwordHash: await bcrypt.hash(FOUNDER_PASSWORD, 10),
      role: ROLES.FOUNDER,
    });
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (superAdminEmail && superAdminPassword) {
    const normalizedEmail = superAdminEmail.toLowerCase();
    let superAdmin = await User.findOne({ email: normalizedEmail });
    if (!superAdmin) {
      superAdmin = await User.create({
        orgId: org._id,
        name: "Super Admin",
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(superAdminPassword, 10),
        role: ROLES.SUPER_ADMIN,
      });
    }
    console.log("Super admin email:", normalizedEmail);
  }

  const clientEmail = CLIENT_EMAIL.toLowerCase();
  let client = await Client.findOne({ orgId: org._id, email: clientEmail });
  if (!client) {
    client = await Client.create({
      orgId: org._id,
      name: "Acme Client",
      email: clientEmail,
      companyName: "Acme",
      status: "active",
    });
  }

  let commitment = await Commitment.findOne({ orgId: org._id, title: COMMITMENT_TITLE });
  if (!commitment) {
    commitment = await Commitment.create({
      orgId: org._id,
      clientId: client._id,
      clientSnapshot: {
        name: client.name,
        email: client.email,
        companyName: client.companyName,
      },
      title: COMMITMENT_TITLE,
      scopeTitle: "Phase 1 Scope",
      scopeDescription: "Build landing page + approval workflow",
      amount: 50000,
      currency: "INR",
      createdByUserId: founder._id,
    });
  }

  console.log("Seed complete.");
  console.log("Org ID:", String(org._id));
  console.log("Founder email:", founderEmail);
  console.log("Founder password:", FOUNDER_PASSWORD);
  console.log("Sample Client ID:", String(client._id));
  console.log("Sample Commitment ID:", String(commitment._id));
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
