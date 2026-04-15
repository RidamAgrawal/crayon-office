import express, { Request, Response } from "express";
import cors from "cors";
import authRouter from "./auth/auth.router";
import userRouter from "./auth/user.router";
import spacesRouter from "./spaces/space.router";
import workItemsRouter from "./work-items/work-item.router";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/spaces", spacesRouter);
app.use("/api/work-items", workItemsRouter);

export default app;
