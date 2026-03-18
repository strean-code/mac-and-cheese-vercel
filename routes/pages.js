import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// homepage
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
});

// dynamic pages
router.get("/:page", (req, res) => {

  const page = req.params.page;

  res.sendFile(
    path.join(__dirname, "..", "views", `${page}.html`),
    (err) => {
      if (err) {
        res.status(404).send("Page not found");
      }
    }
  );

});

export default router;