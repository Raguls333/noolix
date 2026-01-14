import mongoose from "mongoose";
const ClientSchema=new mongoose.Schema({
  orgId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  name:{type:String,required:true,trim:true},
  email:{type:String,required:true,lowercase:true,trim:true},
  phone:{type:String,trim:true},
  companyName:{type:String,trim:true},
  isActive:{type:Boolean,default:true},
  status:{type:String,enum:["active","inactive"],default:"active"}
},{timestamps:true});
ClientSchema.index({orgId:1,email:1},{unique:true});
export const Client=mongoose.model("Client",ClientSchema);
