import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { Organization } from "../models/Organization.model.js";
import { env } from "../config/env.js";
import { ok } from "../utils/response.js";
import { AppError } from "../utils/errors.js";

export async function login(req,res){
  const { email, password } = req.validated.body;
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if(!user) throw new AppError("Invalid credentials",401,"UNAUTHORIZED");
  const match = await bcrypt.compare(password, user.passwordHash);
  if(!match) throw new AppError("Invalid credentials",401,"UNAUTHORIZED");
  const org = await Organization.findById(user.orgId).lean();
  if(!org) throw new AppError("Org not found",401,"UNAUTHORIZED");
  const token = jwt.sign({ userId:String(user._id), orgId:String(user.orgId), role:user.role }, env.jwtSecret, { expiresIn:"7d" });
  return ok(res,{ token, user:{id:String(user._id),name:user.name,email:user.email,role:user.role}, org:{id:String(org._id),name:org.name,plan:org.plan,planStatus:org.planStatus} }, req.id);
}
