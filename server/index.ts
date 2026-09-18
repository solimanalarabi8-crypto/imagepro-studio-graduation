import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import {
  processBackgroundRemoval,
  processBackgroundEffect,
  prewarmModels,
} from "./ai-background-removal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));

  // Prewarm model in background
  prewarmModels();

  // API endpoint for AI Neural Background Removal
  app.post("/api/remove-background", async (req, res) => {
    try {
      const { image, roi, model, feather, threshold, defringe } = req.body;
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }
      const result = await processBackgroundRemoval(image, {
        roi,
        model,
        feather,
        threshold,
        defringe,
      });
      res.json(result);
    } catch (err) {
      console.error("AI background removal error in server/index.ts:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // API endpoint for AI Background Effects (Bokeh, Color Splash, Dim, Solid, Gradient)
  app.post("/api/background-effects", async (req, res) => {
    try {
      const {
        image,
        mask,
        effect,
        blurRadius,
        depthGradient,
        solidColor,
        gradientType,
        dimAmount,
        backdropDataUrl,
      } = req.body;

      if (!image || !mask) {
        return res.status(400).json({ error: "Image and mask are required" });
      }

      const result = await processBackgroundEffect(image, mask, {
        effect,
        blurRadius,
        depthGradient,
        solidColor,
        gradientType,
        dimAmount,
        backdropDataUrl,
      });
      res.json(result);
    } catch (err) {
      console.error("AI background effects error in server/index.ts:", err);
      res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = Number(process.env.PORT) || 3000;

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
