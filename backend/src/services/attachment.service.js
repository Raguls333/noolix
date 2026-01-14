import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
export function ensureUploadDir(){
  const dir=path.isAbsolute(env.uploadDir)?env.uploadDir:path.join(process.cwd(), env.uploadDir);
  if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
  return dir;
}
