import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import authRouter from "./auth/auth.router";
import userRouter from "./auth/user.router";

const app = express();
const port = process.env["PORT"] || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});