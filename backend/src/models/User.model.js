import mongoose from "mongoose";
import { ROLES } from "../constants/roles.js";
const UserSchema=new mongoose.Schema({
  orgId:{type:mongoose.Schema.Types.ObjectId,ref:"Organization",required:true,index:true},
  name:{type:String,required:true,trim:true},
  email:{type:String,required:true,lowercase:true,trim:true},
  passwordHash:{type:String,required:true},
  role:{type:String,enum:[ROLES.FOUNDER,ROLES.MANAGER,ROLES.SUPER_ADMIN],required:true,index:true},
  isActive:{type:Boolean,default:true},
},{timestamps:true});
UserSchema.index({orgId:1,email:1},{unique:true});
export const User=mongoose.model("User",UserSchema);
