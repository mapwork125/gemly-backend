import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/index";
import { handleError } from "./utils/errorHandler.utility";
import dotenv from "dotenv";
import path from "path";
dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve the uploads folder as static
app.use("/uploads", express.static(path.join(__dirname, "./uploads")));

app.use("/api/v1", routes);

// health
app.get("/api/v1/health", (_req, res) =>
  res.json({ ok: true, ts: Date.now() })
);
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// global error handler
app.use(handleError);

export default app;
