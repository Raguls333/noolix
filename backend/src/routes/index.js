import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { orgRouter } from "./org.routes.js";
import { usersRouter } from "./users.routes.js";
import { clientsRouter } from "./clients.routes.js";
import { commitmentsRouter } from "./commitments.routes.js";
import { publicRouter } from "./public.routes.js";
import { reportsRouter } from "./reports.routes.js";
import { exportsRouter } from "./exports.routes.js";
import { attachmentsRouter } from "./attachments.routes.js";
import { premiumRouter } from "./premium.routes.js";
import { plansRouter } from "./plans.routes.js";
import { adminRouter } from "./admin.routes.js";
import { changeRequestsRouter } from "./changeRequests.routes.js";
import { settingsRouter } from "./settings.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";

export const apiRouter = Router();

// Internal APIs
apiRouter.use("/auth", authRouter);
apiRouter.use("/org", orgRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/clients", clientsRouter);
apiRouter.use("/commitments", commitmentsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/exports", exportsRouter);
apiRouter.use("/attachments", attachmentsRouter);
apiRouter.use("/premium", premiumRouter);
apiRouter.use("/plans", plansRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/change-requests", changeRequestsRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/dashboard", dashboardRouter);

// Public (no auth, token-based)
apiRouter.use("/public", publicRouter);
