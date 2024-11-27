import { Router } from "express";
import { body, param } from "express-validator";
import { ProjectController } from "../controllers/Project.controller";
import { TaskController } from "../controllers/Task.controller";
import { handleInputErrors } from "../middlewares/validation";
import { projectExists } from "../middlewares/project";
import { hasAutorization, taskBelongsToProject, taskExists } from "../middlewares/task";
import { authenticate } from "../middlewares/auth";
import { TeamMemberController } from "../controllers/TeamController";
import { NoteController } from "../controllers/NoteController";

const router = Router();

router.use(authenticate)

router.post(
  "/",
  body("projectName").notEmpty().withMessage("El nombre del Proyecto es Obligatorio"),
  body("clientName").notEmpty().withMessage("El nombre del Cliente es Obligatorio"),
  body("description").notEmpty().withMessage("La descripción del Proyecto es Obligatoria"),
  handleInputErrors,
  ProjectController.createProject
);

router.get("/", ProjectController.getAllProjects);

router.get(
  "/:id",
  param("id").isMongoId().withMessage("ID no válido"),
  handleInputErrors,
  ProjectController.getProjectById
);

router.put(
  "/:id",
  param("id").isMongoId().withMessage("ID no válido"),
  body("projectName").notEmpty().withMessage("El nombre del Proyecto es Obligatorio"),
  body("clientName").notEmpty().withMessage("El nombre del Cliente es Obligatorio"),
  body("description").notEmpty().withMessage("La descripción del Proyecto es Obligatoria"),
  handleInputErrors,
  ProjectController.updateProject
);

router.delete(
  "/:id",
  param("id").isMongoId().withMessage("ID no válido"),
  handleInputErrors,
  ProjectController.deleteProject
);

//Routes for tasks
//Parametric Middleware/////////////////////
router.param("projectId", projectExists);
///////////////////////////////////////////

router.post(
  "/:projectId/task",
  hasAutorization,
  body("name").notEmpty().withMessage("El nombre de la tarea es Obligatorio"),
  body("description").notEmpty().withMessage("La description de la tarea es Obligatoria"),
  handleInputErrors,
  TaskController.createTask
);

router.get("/:projectId/task", TaskController.getProjectTasks);


//Parametric Middlewares //////////
router.param("taskId", taskExists);
router.param("taskId", taskBelongsToProject);
//////////////////////////////////

router.get(
  "/:projectId/task/:taskId",
  param("taskId").isMongoId().withMessage("ID no válido"),
  handleInputErrors,
  TaskController.getTaskById
);

router.put(
  "/:projectId/task/:taskId",
  hasAutorization,
  param("taskId").isMongoId().withMessage("ID no válido"),
  body("name").notEmpty().withMessage("El nombre de la tarea es Obligatorio"),
  body("description").notEmpty().withMessage("La description de la tarea es Obligatoria"),
  handleInputErrors,
  TaskController.updateTask
);

router.delete(
  "/:projectId/task/:taskId",
  hasAutorization,
  param("taskId").isMongoId().withMessage("ID no válido"),
  handleInputErrors,
  TaskController.deleteTask
);

router.post(
  "/:projectId/task/:taskId/status",
  param("taskId").isMongoId().withMessage("ID no válido"),
  body("status").notEmpty().withMessage("EL estado es obligatorio"),
  handleInputErrors,
  TaskController.updateStatus
);

/**  Routes for teams */
router.post("/:projectId/team/find",
  body("email").isEmail().toLowerCase().withMessage("E-mail no válido"),
  handleInputErrors,
  TeamMemberController.findMemberByEmail
)

router.get("/:projectId/team",
  TeamMemberController.getProjectTeam
)

router.post("/:projectId/team",
  body("id").isMongoId().withMessage("ID No Válido"),
  handleInputErrors,
  TeamMemberController.addMemberById
)

router.delete("/:projectId/team/:userId",
  param("userId").isMongoId().withMessage("ID No Válido"),
  handleInputErrors,
  TeamMemberController.removeMemberById
)

/** Routes for Notes */
router.post("/:projectId/tasks/:taskId/notes",
  body("content").notEmpty().withMessage("El contenido de la nota es obligatorio"),
  handleInputErrors,
  NoteController.createNote
)

router.get("/:projectId/tasks/:taskId/notes",
  NoteController.getTaskNotes
)

router.delete("/:projectId/tasks/:taskId/notes/:noteId",
  param("noteId").isMongoId().withMessage("ID no Válido"),
  handleInputErrors,
  NoteController.deleteNote
)


export default router;
