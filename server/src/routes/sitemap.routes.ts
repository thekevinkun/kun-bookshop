import { Router } from "express"; // Express router
import { getSitemap } from "../controllers/sitemap.controller"; // sitemap controller

const router = Router();

// GET /sitemap.xml — publicly accessible, no auth required
// Google's crawler hits this URL to discover all your pages
router.get("/", getSitemap);

export default router;
