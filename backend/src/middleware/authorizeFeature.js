import { AppError } from "../utils/errors.js";
import { isFeatureAllowed } from "../services/plan.service.js";
import { env } from "../config/env.js";
import { FEATURES } from "../constants/features.js";
import { ROLES } from "../constants/roles.js";
export function authorizeFeature(feature){
  return (req,_res,next)=>{
    if(!req.org) return next(new AppError("Org missing",401,"UNAUTHORIZED"));
    if(req.user?.role===ROLES.SUPER_ADMIN) return next();
    const premiumFeatures=new Set([FEATURES.BRANDED_PDF,FEATURES.AUTO_REMINDERS,FEATURES.CLIENT_PORTAL]);
    if(premiumFeatures.has(feature) && !env.enablePremium) return next(new AppError("Premium disabled by server config",403,"PREMIUM_DISABLED"));
    if(!isFeatureAllowed(req.org.plan, feature)) return next(new AppError("Feature not allowed for your plan",403,"PLAN_FORBIDDEN"));
    next();
  };
}
