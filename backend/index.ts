import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mailAccountsRouter from "./src/routes/mailAccounts";
import automationFlowsRouter from "./src/routes/automationFlows";
import oauthRouter from "./src/routes/oauth";
import { startScheduler } from "./src/services/automation";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Routes
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from autoMail backend!" });
});

app.use("/api/mail-accounts", mailAccountsRouter);
app.use("/api/automation-flows", automationFlowsRouter);
app.use("/api/oauth", oauthRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);

  // Start automation scheduler
  startScheduler();
});
