import type { Request, Response } from "express";
import Project from "../models/Project";

export class ProjectController {
  static createProject = async (req: Request, res: Response) => {
    const project = new Project(req.body);

    //Assing manager
    project.manager = req.recover_user.id

    try {
      await project.save();
      res.send("Proyecto creado correctamente");
    } catch (error) {
      console.log(error);
    }
  };

  static getAllProjects = async (req: Request, res: Response) => {
    try {
      const projects = await Project.find({
        $or: [
          { manager: { $in: req.recover_user.id } },
          { team: { $in: req.recover_user.id } }
        ]
      });
      res.json(projects);
    } catch (error) {
      console.log(error);
    }
  };

  static getProjectById = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const project = await Project.findById(id).populate("tasks");
      if (!project) {
        const error = new Error("Proyecto no encontrado");
        res.status(404).json({ error: error.message });
        return;
      }

      //Restrict only owners
      if (project.manager.toString() !== req.recover_user.id.toString() && !project.team.includes(req.recover_user.id)) {
        const error = new Error("Acción no válida");
        res.status(404).json({ error: error.message });
        return;
      }

      res.json(project);
    } catch (error) {
      console.log(error);
    }
  };

  static updateProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const project = await Project.findById(id);
      if (!project) {
        const error = new Error("Proyecto no encontrado");
        res.status(404).json({ error: error.message });
        return;
      }

      //Restrict only owners
      if (project.manager.toString() !== req.recover_user.id.toString()) {
        const error = new Error("Solo el Manager puede actualizar un Proyecto");
        res.status(404).json({ error: error.message });
        return;
      }

      project.clientName = req.body.clientName;
      project.projectName = req.body.projectName;
      project.description = req.body.description;

      await project.save();
      res.send("Proyecto Actualizado");
    } catch (error) {
      console.log(error);
    }
  };

  static deleteProject = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const project = await Project.findById(id);
      if (!project) {
        const error = new Error("Proyecto no encontrado");
        res.status(404).json({ error: error.message });
        return;
      }
      //Restrict only owners
      if (project.manager.toString() !== req.recover_user.id.toString()) {
        const error = new Error("Solo el Manager puede eliminar un Proyecto");
        res.status(404).json({ error: error.message });
        return;
      }
      await project.deleteOne();
      res.send("Proyecto eliminado");
    } catch (error) {
      console.log(error);
    }
  };
}
