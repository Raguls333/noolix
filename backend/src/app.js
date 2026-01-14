import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import crypto from "crypto";

import { logger } from "./utils/logger.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { apiRouter } from "./routes/index.js";
import { uploadsRouter } from "./routes/uploads.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "20mb" }));

  app.use((req, _res, next) => {
    req.id = req.headers["x-request-id"] || crypto.randomUUID();
    next();
  });

  app.use(pinoHttp({ logger }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  // ✅ Centralized API base path
  app.use("/api", apiRouter);

  app.use("/api/uploads", uploadsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
