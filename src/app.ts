import express from "express";
import cors from "cors";
import helmet from "helmet";
import routes from "./routes/index";
import { handleError } from "./utils/errorHandler.utility";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", routes);

// health
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// global error handler
app.use(handleError);

export default app;
