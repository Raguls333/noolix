import { Commitment } from "../models/Commitment.model.js";
import { ROLES } from "../constants/roles.js";
import { AppError } from "../utils/errors.js";
export async function authorizeCommitmentAccess(req,_res,next){
  const commitment=await Commitment.findOne({_id:req.params.id, orgId:req.user.orgId}).lean();
  if(!commitment) return next(new AppError("Commitment not found",404,"NOT_FOUND"));
  if(req.user.role===ROLES.MANAGER){
    if(!commitment.assignedToUserId || String(commitment.assignedToUserId)!==req.user.userId){
      return next(new AppError("Forbidden",403,"FORBIDDEN"));
    }
  }
  req.commitment=commitment;
  next();
}
