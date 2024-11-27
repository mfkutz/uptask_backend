//Nested Resource Routing
import type { Request, Response, NextFunction } from "express";
import Project, { IProject } from "../models/Project";

declare global {
  namespace Express {
    interface Request {
      project: IProject;
    }
  }
}

//Parametric Middleware
export async function projectExists(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) {
      const error = new Error("Proyecto no encontrado");
      res.status(404).json({ error: error.message });
      return;
    }
    req.project = project; //Property 'project' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'  - USE DECLARE GLOBAL, and pass IProject
    next();
  } catch (error) {
    res.status(500).json({ error: "Hubo un error" });
  }
}
