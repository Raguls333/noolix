import mongoose from "mongoose";
const AttachmentSchema=new mongoose.Schema({
  orgId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  commitmentId:{type:mongoose.Schema.Types.ObjectId,ref:"Commitment",index:true},
  storageKey:{type:String,required:true},
  originalName:{type:String,required:true},
  mimeType:{type:String,required:true},
  size:{type:Number,required:true},
  status:{type:String,enum:["UPLOADED","ATTACHED"],default:"UPLOADED",index:true},
  uploadedByUserId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
},{timestamps:true});
export const Attachment=mongoose.model("Attachment",AttachmentSchema);
