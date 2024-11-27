import type { Request, Response } from "express";
import Task from "../models/Task";

export class TaskController {
  static createTask = async (req: Request, res: Response) => {
    try {
      const task = new Task(req.body);
      // Asigna el ID del proyecto actual (req.project.id) a la propiedad 'project' de la nueva tarea.
      // Esto establece una relación en la tarea, indicando a qué proyecto pertenece.
      task.project = req.project.id;
      // Agrega el ID de la tarea recién creada (task.id) al array 'tasks' en el proyecto (req.project).
      // Esto actualiza la lista de tareas asociadas en el proyecto, creando una relación bidireccional.
      req.project.tasks.push(task.id);

      await Promise.allSettled([task.save(), req.project.save()]);

      res.send("Tarea creada correctamente");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static getProjectTasks = async (req: Request, res: Response) => {
    try {
      const tasks = await Task.find({ project: req.project.id }).populate("project"); //buscando todas las tareas (Task) cuyo campo project coincide con el id del proyecto almacenado en req.project.id
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static getTaskById = async (req: Request, res: Response) => {
    try {
      const task = await Task.findById(req.task.id)
        .populate({ path: "completedBy.user", select: "id name email" })
        .populate({ path: "notes", populate: { path: 'createdBy', select: 'id name email' } }) //Deep populate
      res.json(task)
      // res.json(req.task);
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static updateTask = async (req: Request, res: Response) => {
    try {
      /* //si la tarea no pertenece al proyecto
      if (req.task.project.toString() !== req.project.id) {
        const error = new Error("Acción no válida");
        res.status(400).json({ error: error.message });
        return;
      } */

      req.task.name = req.body.name;
      req.task.description = req.body.description;

      await req.task.save();
      res.send("Tarea actualizada correctamente");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static deleteTask = async (req: Request, res: Response) => {
    try {
      req.project.tasks = req.project.tasks.filter(
        (task) => task.toString() !== req.task.id.toString()
      );

      await Promise.allSettled([req.task.deleteOne(), req.project.save()]);

      res.send("Tarea eliminada correctamente");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static updateStatus = async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      req.task.status = status;
      const data = {
        user: req.recover_user.id,
        status
      }
      req.task.completedBy.push(data)
      await req.task.save();
      res.send("Tarea Actualizada");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };
}
