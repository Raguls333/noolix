import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
async function main(){ await connectDb(); const app=createApp(); app.listen(env.port, ()=>logger.info({port:env.port},"NOOLIX API listening")); }
main().catch(err=>{ logger.error({err},"Failed to start"); process.exit(1); });
