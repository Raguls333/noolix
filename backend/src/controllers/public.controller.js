import { ok } from "../utils/response.js";
import { AppError } from "../utils/errors.js";
import { createTokenHash } from "../services/token.service.js";
import { consumeApprovalToken, consumeAcceptanceToken } from "../services/commitment.service.js";
import { SecureLink } from "../models/SecureLink.model.js";
import { Commitment } from "../models/Commitment.model.js";
import { Client } from "../models/Client.model.js";

export async function getApprove(req,res){
  const tokenHash=createTokenHash(req.params.token);
  const link=await SecureLink.findOne({ tokenHash, purpose:"APPROVAL", expiresAt:{ $gt:new Date() } }).lean();
  if(!link) throw new AppError("Link is invalid or expired",400,"LINK_INVALID");
  const commitment=await Commitment.findById(link.commitmentId).lean();
  if(!commitment) throw new AppError("Commitment not found",404,"NOT_FOUND");
  const client=await Client.findById(commitment.clientId).lean();
  return ok(res,{ purpose:"APPROVAL", versionOk: commitment.version===link.commitmentVersion, commitment:{ commitment }, client: client?{name:client.name,email:client.email}:null }, req.id);
}
export async function postApprove(req,res){
  const tokenHash=createTokenHash(req.params.token);
  return ok(res, await consumeApprovalToken({ tokenHash, action:req.validated.body.action, comment:req.validated.body.comment, meta:{ ip:req.ip, ua:req.headers["user-agent"] } }), req.id);
}
export async function getAccept(req,res){
  const tokenHash=createTokenHash(req.params.token);
  const link=await SecureLink.findOne({ tokenHash, purpose:"ACCEPTANCE", expiresAt:{ $gt:new Date() } }).lean();
  if(!link) throw new AppError("Link is invalid or expired",400,"LINK_INVALID");
  const commitment=await Commitment.findById(link.commitmentId).lean();
  if(!commitment) throw new AppError("Commitment not found",404,"NOT_FOUND");
  const client=await Client.findById(commitment.clientId).lean();
  return ok(res,{ purpose:"ACCEPTANCE", versionOk: commitment.version===link.commitmentVersion, commitment:{ commitment }, client: client?{name:client.name,email:client.email}:null }, req.id);
}
export async function postAccept(req,res){
  const tokenHash=createTokenHash(req.params.token);
  return ok(res, await consumeAcceptanceToken({ tokenHash, comment:req.validated.body.comment, meta:{ ip:req.ip, ua:req.headers["user-agent"] } }), req.id);
}
