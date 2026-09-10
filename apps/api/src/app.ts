import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import problemRoutes from "./routes/problemRoutes";
import attemptRoutes from "./routes/attemptRoutes";
import { DomainError } from "./domain/errors/DomainError";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "lld-practice-api",
  });
});

app.use("/api/problems", problemRoutes);
app.use("/api/attempts", attemptRoutes);

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    if (error instanceof DomainError) {
      const status =
        error.message.includes("not found") ? 404 : 400;

      res.status(status).json({
        error: error.message,
      });
      return;
    }

    console.error(error);

    res.status(500).json({
      error: "Internal server error",
    });
  },
);

export default app;