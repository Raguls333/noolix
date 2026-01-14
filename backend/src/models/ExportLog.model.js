import mongoose from "mongoose";
const ExportLogSchema=new mongoose.Schema({
  orgId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  type:{type:String,enum:["PDF","CSV"],required:true,index:true},
  entityType:{type:String,required:true},
  entityId:{type:String,required:true,index:true},
  requestedByUserId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  meta:Object,
},{timestamps:true});
ExportLogSchema.index({orgId:1,type:1,createdAt:-1});
export const ExportLog=mongoose.model("ExportLog",ExportLogSchema);
