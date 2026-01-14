import { Attachment } from "../models/Attachment.model.js";
import { Commitment } from "../models/Commitment.model.js";
import { ok } from "../utils/response.js";
import { AppError } from "../utils/errors.js";
export async function uploadInit(req,res){
  if(!req.file) throw new AppError("File missing",400,"FILE_MISSING");
  const att=await Attachment.create({ orgId:req.user.orgId, storageKey:req.file.path, originalName:req.file.originalname, mimeType:req.file.mimetype, size:req.file.size, status:"UPLOADED", uploadedByUserId:req.user.userId });
  return ok(res,{ attachmentId:String(att._id), originalName:att.originalName }, req.id);
}
export async function completeAttach(req,res){
  const { attachmentId, commitmentId } = req.validated.body;
  const commitment=await Commitment.findOne({_id:commitmentId, orgId:req.user.orgId}).lean();
  if(!commitment) throw new AppError("Commitment not found",404,"NOT_FOUND");
  const att=await Attachment.findOneAndUpdate({_id:attachmentId, orgId:req.user.orgId},{ $set:{ commitmentId, status:"ATTACHED" }},{ new:true }).lean();
  if(!att) throw new AppError("Attachment not found",404,"NOT_FOUND");
  return ok(res,{ attachmentId:String(att._id), commitmentId }, req.id);
}
export async function listByCommitment(req,res){
  const items=await Attachment.find({ orgId:req.user.orgId, commitmentId:req.params.id }).sort({createdAt:-1}).lean();
  return ok(res,{ items }, req.id);
}
