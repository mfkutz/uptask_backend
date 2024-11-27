//Nested Resource Routing
import type { Request, Response, NextFunction } from "express";
import Task, { ITask } from "../models/Task";

declare global {
  namespace Express {
    interface Request {
      task: ITask;
    }
  }
}

export async function taskExists(req: Request, res: Response, next: NextFunction) {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      const error = new Error("Tarea no encontrada");
      res.status(404).json({ error: error.message });
      return;
    }
    req.task = task; //Property 'project' does not exist on type 'Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>'  - USE DECLARE GLOBAL, and pass IProject
    next();
  } catch (error) {
    res.status(500).json({ error: "Hubo un error" });
  }
}

export function taskBelongsToProject(req: Request, res: Response, next: NextFunction) {
  //si la tarea no pertenece al proyecto
  if (req.task.project.toString() !== req.project.id.toString()) {
    const error = new Error("Acción no válida");
    res.status(400).json({ error: error.message });
    return;
  }
  next();
}

//restricting colaborator to create, update and delete task
export function hasAutorization(req: Request, res: Response, next: NextFunction) {
  if (req.recover_user.id.toString() !== req.project.manager.toString()) {
    const error = new Error("Acción no válida");
    res.status(400).json({ error: error.message });
    return;
  }
  next();
}
