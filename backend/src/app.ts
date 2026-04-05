import express, { Request, Response } from "express";
import cors from "cors";
import authRouter from "./auth/auth.router";
import userRouter from "./auth/user.router";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

export default app;
