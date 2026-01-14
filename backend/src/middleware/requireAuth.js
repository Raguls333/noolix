import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { User } from "../models/User.model.js";
import { Organization } from "../models/Organization.model.js";
export async function requireAuth(req,_res,next){
  const h=req.headers.authorization||""; const token=h.startsWith("Bearer ")?h.slice(7):null;
  if(!token) return next(new AppError("Missing auth token",401,"UNAUTHORIZED"));
  try{
    const payload=jwt.verify(token, env.jwtSecret);
    const user=await User.findOne({_id:payload.userId, orgId:payload.orgId, isActive:true}).lean();
    if(!user) return next(new AppError("User not found",401,"UNAUTHORIZED"));
    const org=await Organization.findById(payload.orgId).lean();
    if(!org) return next(new AppError("Org not found",401,"UNAUTHORIZED"));
    req.user={ userId:String(user._id), orgId:String(user.orgId), role:user.role, email:user.email, name:user.name };
    req.org={ id:String(org._id), plan:org.plan, planStatus:org.planStatus, name:org.name };
    next();
  }catch{ next(new AppError("Invalid token",401,"UNAUTHORIZED")); }
}
