import bcrypt from "bcryptjs";
import crypto from "crypto";
import { ok } from "../utils/response.js";
import { AppError } from "../utils/errors.js";
import { User } from "../models/User.model.js";
import { ROLES } from "../constants/roles.js";
import { sendInviteEmail } from "../services/mail.service.js";

export async function createManager(req,res){
  const { name, email, password } = req.validated.body;
  const exists = await User.findOne({ orgId:req.user.orgId, email:email.toLowerCase() }).lean();
  if(exists) throw new AppError("Email already exists",409,"CONFLICT");
  const u = await User.create({ orgId:req.user.orgId, name, email:email.toLowerCase(), passwordHash: await bcrypt.hash(password,10), role: ROLES.MANAGER });
  return ok(res,{ user:{id:String(u._id),name:u.name,email:u.email,role:u.role} }, req.id);
}

export async function listUsers(req,res){
  const users = await User.find({ orgId:req.user.orgId, isActive:true }).select("_id name email role createdAt").lean();
  return ok(res,{ users: users.map(u=>({id:String(u._id),name:u.name,email:u.email,role:u.role,createdAt:u.createdAt})) }, req.id);
}

function generateTempPassword(length = 12) {
  const raw = crypto.randomBytes(24).toString("base64");
  const sanitized = raw.replace(/[^a-zA-Z0-9]/g, "");
  return sanitized.slice(0, length);
}

export async function inviteManager(req, res) {
  const { name, email } = req.validated.body;
  const normalizedEmail = email.toLowerCase();

  const exists = await User.findOne({ orgId: req.user.orgId, email: normalizedEmail }).lean();
  if (exists) throw new AppError("Email already exists", 409, "CONFLICT");

  const tempPassword = generateTempPassword(12);
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const user = await User.create({
    orgId: req.user.orgId,
    name,
    email: normalizedEmail,
    passwordHash,
    role: ROLES.MANAGER,
  });

  await sendInviteEmail({
    to: normalizedEmail,
    name,
    tempPassword,
    invitedBy: req.user.name,
  });

  return ok(
    res,
    {
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
      tempPassword,
    },
    req.id
  );
}
