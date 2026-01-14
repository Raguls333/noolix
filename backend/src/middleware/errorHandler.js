import { logger } from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";
export function notFound(_req,res){ res.status(404).json({ok:false,code:"NOT_FOUND",message:"Route not found"}); }
export function errorHandler(err,req,res,_next){
  const isApp=err instanceof AppError || err.code==="VALIDATION_ERROR";
  const status=isApp ? (err.statusCode||400) : 500;
  const code=isApp ? (err.code||"BAD_REQUEST") : "INTERNAL_ERROR";
  logger.error({err,requestId:req.id},"Request failed");
  const payload={ ok:false, requestId:req.id, code, message: isApp ? err.message : "Something went wrong" };
  if(isApp && err.details) payload.details=err.details;
  if(env.nodeEnv!=="production" && !isApp) payload.stack=err.stack;
  res.status(status).json(payload);
}
