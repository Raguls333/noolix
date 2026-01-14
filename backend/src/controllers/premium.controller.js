import { ok } from "../utils/response.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { Organization } from "../models/Organization.model.js";
const assertPremium=()=>{ if(!env.enablePremium) throw new AppError("Premium module disabled by server config",403,"PREMIUM_DISABLED"); };
export async function getBranding(req,res){ assertPremium(); const org=await Organization.findById(req.user.orgId).lean(); return ok(res,{ brandingSettings: org?.brandingSettings||{} }, req.id); }
export async function updateBranding(req,res){ assertPremium(); const updated=await Organization.findByIdAndUpdate(req.user.orgId,{ $set:{ brandingSettings:req.body||{} }},{ new:true }).lean(); return ok(res,{ brandingSettings: updated?.brandingSettings||{} }, req.id); }
export async function getSlaRules(req,res){ assertPremium(); const org=await Organization.findById(req.user.orgId).lean(); return ok(res,{ slaSettings: org?.slaSettings||{} }, req.id); }
export async function updateSlaRules(req,res){ assertPremium(); const updated=await Organization.findByIdAndUpdate(req.user.orgId,{ $set:{ slaSettings:req.body||{} }},{ new:true }).lean(); return ok(res,{ slaSettings: updated?.slaSettings||{} }, req.id); }
export async function inviteClientPortal(req,res){ assertPremium(); return ok(res,{ message:"Client portal invite placeholder" }, req.id); }
export async function clientPortalLogin(req,res){ assertPremium(); return ok(res,{ token:"placeholder" }, req.id); }
export async function clientPortalCommitments(req,res){ assertPremium(); return ok(res,{ items:[] }, req.id); }
