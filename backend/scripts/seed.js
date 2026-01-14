import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { Organization } from "../src/models/Organization.model.js";
import { User } from "../src/models/User.model.js";
import { Client } from "../src/models/Client.model.js";
import { Commitment } from "../src/models/Commitment.model.js";
import { ROLES } from "../src/constants/roles.js";
import { PLANS } from "../src/constants/plans.js";
await mongoose.connect(env.mongoUri);
let org=await Organization.findOne({name:"NOOLIX Demo Org"});
if(!org) org=await Organization.create({name:"NOOLIX Demo Org", plan:PLANS.AGENCY, planStatus:"ACTIVE"});
const email="founder@noolix.dev";
let founder=await User.findOne({orgId:org._id,email});
if(!founder) founder=await User.create({orgId:org._id,name:"Founder",email,passwordHash:await bcrypt.hash("ChangeMe123!",10),role:ROLES.FOUNDER});
const superAdminEmail=process.env.SUPER_ADMIN_EMAIL;
const superAdminPassword=process.env.SUPER_ADMIN_PASSWORD;
if(superAdminEmail && superAdminPassword){
  let superAdmin=await User.findOne({email:superAdminEmail.toLowerCase()});
  if(!superAdmin){
    superAdmin=await User.create({
      orgId:org._id,
      name:"Super Admin",
      email:superAdminEmail.toLowerCase(),
      passwordHash:await bcrypt.hash(superAdminPassword,10),
      role:ROLES.SUPER_ADMIN,
    });
  }
  console.log("Super admin email:",superAdminEmail);
}
let client=await Client.findOne({orgId:org._id,email:"client@acme.com"});
if(!client) client=await Client.create({orgId:org._id,name:"Acme Client",email:"client@acme.com",companyName:"Acme"});
let commitment=await Commitment.findOne({orgId:org._id,title:"Sample Commitment"});
if(!commitment) commitment=await Commitment.create({orgId:org._id,clientId:client._id,title:"Sample Commitment",scopeText:"Build landing page + approval workflow",amount:50000,currency:"INR",createdByUserId:founder._id});
console.log("Seed complete ✅");
console.log("Org ID:",String(org._id));
console.log("Founder email:",email);
console.log("Founder password: ChangeMe123!");
console.log("Sample Client ID:",String(client._id));
console.log("Sample Commitment ID:",String(commitment._id));
await mongoose.disconnect();
