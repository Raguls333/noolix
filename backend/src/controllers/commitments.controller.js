import { ok } from "../utils/response.js";
import { sanitizeCommitmentForRole } from "../utils/sanitize.js";
import { FEATURES } from "../constants/features.js";
import { isFeatureAllowed } from "../services/plan.service.js";
import { AppError } from "../utils/errors.js";
import {
  createCommitment, listCommitments, getCommitment, updateCommitment,
  assignCommitment, markDelivered, sendApprovalLink, sendAcceptanceLink, getHistory,
  listChangeRequests, acceptChangeRequest, rejectChangeRequest
} from "../services/commitment.service.js";

export async function createOne(req, res) {
  const { sendApproval, assignedToUserId, ...data } = req.validated.body;
  const canAssign = isFeatureAllowed(req.org.plan, FEATURES.ASSIGN_COMMITMENT);
  if (assignedToUserId && !canAssign) throw new AppError("Not allowed", 403, "PLAN_FORBIDDEN");
  const effectiveAssignee = canAssign ? (assignedToUserId || req.user.userId) : req.user.userId;

  const c = await createCommitment({
    orgId: req.user.orgId,
    userId: req.user.userId,
    assignedToUserId: effectiveAssignee,
    data,
  });

  if (sendApproval) {
    await sendApprovalLink({
      orgId: req.user.orgId,
      role: req.user.role,
      userId: req.user.userId,
      id: c._id,
      resend: false,
    });
  }

  return ok(
    res,
    { commitment: sanitizeCommitmentForRole(c, req.user.role) },
    req.id
  );
}

export async function list(req,res){
  const result=await listCommitments({ orgId:req.user.orgId, role:req.user.role, userId:req.user.userId, filters:req.validated.query });
  return ok(res,{ ...result, items: result.items.map(i=>sanitizeCommitmentForRole(i, req.user.role)) }, req.id);
}
export async function getOne(req,res){
  const c=await getCommitment({ orgId:req.user.orgId, role:req.user.role, userId:req.user.userId, id:req.params.id });
  return ok(res,{ commitment:sanitizeCommitmentForRole(c, req.user.role) }, req.id);
}
export async function updateOne(req,res){
  const updated=await updateCommitment({ orgId:req.user.orgId, role:req.user.role, userId:req.user.userId, id:req.params.id, patch:req.validated.body });
  return ok(res,{ commitment:sanitizeCommitmentForRole(updated, req.user.role) }, req.id);
}
export async function assign(req,res){
  if(!isFeatureAllowed(req.org.plan, FEATURES.ASSIGN_COMMITMENT)) throw new AppError("Not allowed",403,"PLAN_FORBIDDEN");
  const updated=await assignCommitment({ orgId:req.user.orgId, userId:req.user.userId, id:req.params.id, assignedToUserId:req.validated.body.assignedToUserId });
  return ok(res,{ commitment:sanitizeCommitmentForRole(updated, req.user.role) }, req.id);
}
export async function markDeliveredCtrl(req,res){
  const updated=await markDelivered({ orgId:req.user.orgId, role:req.user.role, userId:req.user.userId, id:req.params.id });
  return ok(res,{ commitment:sanitizeCommitmentForRole(updated, req.user.role) }, req.id);
}
export async function sendApproval(req,res){ return ok(res, await sendApprovalLink({ orgId:req.user.orgId, role:req.user.role, userId:req.user.userId, id:req.params.id, resend:false }), req.id); }
export async function resendApproval(req,res){ return ok(res, await sendApprovalLink({ orgId:req.user.orgId, role:req.user.role, userId:req.user.userId, id:req.params.id, resend:true }), req.id); }
export async function sendAcceptance(req,res){ return ok(res, await sendAcceptanceLink({ orgId:req.user.orgId, role:req.user.role, userId:req.user.userId, id:req.params.id, resend:false }), req.id); }
export async function resendAcceptance(req,res){ return ok(res, await sendAcceptanceLink({ orgId:req.user.orgId, role:req.user.role, userId:req.user.userId, id:req.params.id, resend:true }), req.id); }
export async function history(req,res){ return ok(res,{ events: await getHistory({ orgId:req.user.orgId, commitmentId:req.params.id }) }, req.id); }

export async function listChangeRequestsCtrl(req,res){
  const items = await listChangeRequests({ orgId:req.user.orgId, commitmentId:req.params.id });
  return ok(res,{ items }, req.id);
}

export async function acceptChangeRequestCtrl(req,res){
  const { assignedToUserId, resolutionNote, ...patch } = req.validated.body;
  const canAssign = isFeatureAllowed(req.org.plan, FEATURES.ASSIGN_COMMITMENT);
  if (assignedToUserId && !canAssign) throw new AppError("Not allowed", 403, "PLAN_FORBIDDEN");
  const effectiveAssignee = assignedToUserId || (canAssign ? req.commitment?.assignedToUserId : undefined);

  const updated = await acceptChangeRequest({
    orgId: req.user.orgId,
    userId: req.user.userId,
    role: req.user.role,
    commitmentId: req.params.id,
    changeRequestId: req.params.changeRequestId,
    patch,
    assignedToUserId: effectiveAssignee,
    resolutionNote,
  });

  return ok(res,{ commitment: sanitizeCommitmentForRole(updated, req.user.role) }, req.id);
}

export async function rejectChangeRequestCtrl(req,res){
  const updated = await rejectChangeRequest({
    orgId: req.user.orgId,
    userId: req.user.userId,
    role: req.user.role,
    commitmentId: req.params.id,
    changeRequestId: req.params.changeRequestId,
    resolutionNote: req.validated.body.resolutionNote,
  });
  return ok(res, updated, req.id);
}
