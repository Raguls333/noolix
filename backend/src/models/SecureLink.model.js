import mongoose from "mongoose";
import { LINK_PURPOSE } from "../constants/status.js";
const SecureLinkSchema=new mongoose.Schema({
  orgId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  commitmentId:{type:mongoose.Schema.Types.ObjectId,ref:"Commitment",required:true,index:true},
  commitmentVersion:{type:Number,required:true},
  purpose:{type:String,enum:Object.values(LINK_PURPOSE),required:true,index:true},
  tokenHash:{type:String,required:true,unique:true,index:true},
  expiresAt:Date,
  usedAt:Date,
},{timestamps:true});
export const SecureLink=mongoose.model("SecureLink",SecureLinkSchema);
