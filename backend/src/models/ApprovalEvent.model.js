import mongoose from "mongoose";
const ApprovalEventSchema=new mongoose.Schema({
  orgId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  commitmentId:{type:mongoose.Schema.Types.ObjectId,ref:"Commitment",required:true,index:true},
  commitmentVersion:{type:Number,required:true},
  actorType:{type:String,enum:["USER","CLIENT"],required:true},
  actorUserId:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
  type:{type:String,required:true},
  message:String,
  meta:Object,
},{timestamps:true});
ApprovalEventSchema.index({orgId:1,commitmentId:1,createdAt:1});
export const ApprovalEvent=mongoose.model("ApprovalEvent",ApprovalEventSchema);
