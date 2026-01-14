import { ok } from '../utils/response.js'; export async function me(req,res){ return ok(res,{org:req.org,user:req.user},req.id);} 
