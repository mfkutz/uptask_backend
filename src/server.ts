import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { corsConfig } from "./config/cors";
import { connectDB } from "./config/db";
import authRoutes from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";

dotenv.config();

connectDB();

const app = express();
app.use(cors(corsConfig));

//Login
app.use(morgan("dev"));

//Read data from forms
app.use(express.json());

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use((req, res) => {
  res.send("URL no encontrada");
});

export default app;
