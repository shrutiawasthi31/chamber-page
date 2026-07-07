import { Router } from "express";

import {
  getCurrentUser,
  handleLinkedInCallback,
  redirectToLinkedIn
} from "../controllers/linkedinController.js";
import { authenticateRequest } from "../middleware/auth.js";

const router = Router();

router.get("/", redirectToLinkedIn);
router.get("/callback", handleLinkedInCallback);
router.get("/me", authenticateRequest, getCurrentUser);

export default router;
