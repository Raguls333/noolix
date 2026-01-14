import { Client } from "../models/Client.model.js";
import { ok } from "../utils/response.js";
import { AppError } from "../utils/errors.js";

export async function createClient(req,res){
  const data=req.validated.body;
  const exists=await Client.findOne({orgId:req.user.orgId,email:data.email.toLowerCase()}).lean();
  if(exists) throw new AppError("Client email already exists",409,"CONFLICT");
  const client=await Client.create({ orgId:req.user.orgId, name:data.name, email:data.email.toLowerCase(), phone:data.phone, companyName:data.companyName, status: "active" });
  return ok(res,{ client:{id:String(client._id),...client.toObject()} }, req.id);
}
export async function listClients(req,res){
  const page=Number(req.query.page||1), limit=Math.min(Number(req.query.limit||20),100), skip=(page-1)*limit;
  const search=String(req.query.search||"").trim();
  const q={ orgId:req.user.orgId };
  if(search) q.$or=[{name:{$regex:search,$options:"i"}},{email:{$regex:search,$options:"i"}},{companyName:{$regex:search,$options:"i"}}];
  const [items,total]=await Promise.all([Client.find(q).sort({updatedAt:-1}).skip(skip).limit(limit).lean(), Client.countDocuments(q)]);
  return ok(res,{ clients: items.map(c=>({id:String(c._id),...c})), page, limit, total }, req.id);
}
export async function getClient(req,res){
  const c=await Client.findOne({_id:req.params.id,orgId:req.user.orgId}).lean();
  if(!c) throw new AppError("Client not found",404,"NOT_FOUND");
  return ok(res,{ client:{id:String(c._id),...c} }, req.id);
}
export async function updateClient(req,res){
  const patch=req.validated.body;
  if(patch.email) patch.email=patch.email.toLowerCase();
  const updated=await Client.findOneAndUpdate({_id:req.params.id,orgId:req.user.orgId},{ $set: patch },{ new:true }).lean();
  if(!updated) throw new AppError("Client not found",404,"NOT_FOUND");
  return ok(res,{ client:{id:String(updated._id),...updated} }, req.id);
}
