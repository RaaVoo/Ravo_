import { Router } from "express";
import { getNextVideoController, getVideoByIdController } from "../controllers/video.controller.js";

const router = Router();
router.get("/next", getNextVideoController);
router.get("/:id", getVideoByIdController);

export default router;
