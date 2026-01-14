import { Commitment } from "../models/Commitment.model.js";
import { Client } from "../models/Client.model.js";
import { Organization } from "../models/Organization.model.js";
import { ApprovalEvent } from "../models/ApprovalEvent.model.js";
import { buildCommitmentProofPdf } from "../services/pdf.service.js";
import { logExport } from "../services/export.service.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";
import { FEATURES } from "../constants/features.js";
import { isFeatureAllowed } from "../services/plan.service.js";
import { Parser } from "@json2csv/plainjs";

export async function exportCommitmentPdf(req,res){
  const commitment=await Commitment.findOne({_id:req.params.id, orgId:req.user.orgId}).lean();
  if(!commitment) throw new AppError("Commitment not found",404,"NOT_FOUND");
  const client=await Client.findOne({_id:commitment.clientId, orgId:req.user.orgId}).lean();
  if(!client) throw new AppError("Client not found",404,"NOT_FOUND");
  const org=await Organization.findById(req.user.orgId).lean();
  const events=await ApprovalEvent.find({orgId:req.user.orgId, commitmentId:commitment._id}).sort({createdAt:1}).lean();
  const allowBranding = env.enablePremium && isFeatureAllowed(req.org.plan, FEATURES.BRANDED_PDF);
  const orgForPdf = allowBranding ? org : { name: org?.name || "NOOLIX" };
  const doc=buildCommitmentProofPdf({org:orgForPdf, client, commitment, events});
  res.setHeader("Content-Type","application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="noolix-proof-${commitment._id}.pdf"`);
  doc.pipe(res);
  await logExport({ orgId:req.user.orgId, type:"PDF", entityType:"COMMITMENT", entityId:String(commitment._id), requestedByUserId:req.user.userId, meta:{ version:commitment.version }});
}
export async function exportReportsCsv(req,res){
  const status=req.query.status;
  const filter={ orgId:req.user.orgId };
  if(status) filter.status=status;
  const rows=await Commitment.find(filter).sort({updatedAt:-1}).limit(5000).lean();
  const parser=new Parser({ fields:["_id","title","status","version","clientId","assignedToUserId","amount","currency","createdAt","updatedAt"]});
  const csv=parser.parse(rows);
  res.setHeader("Content-Type","text/csv");
  res.setHeader("Content-Disposition",'attachment; filename="noolix-report.csv"');
  res.send(csv);
  await logExport({ orgId:req.user.orgId, type:"CSV", entityType:"REPORT", entityId:"commitments", requestedByUserId:req.user.userId, meta:{ status: status||null, rows: rows.length }});
}
