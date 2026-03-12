import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";
import type { Express, Request } from "express";
import { requireAuth } from "./auth";
import { storage } from "./storage";
import { log } from "./index";

const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const diskStorage = multer.diskStorage({
  destination: (req: Request, _file, cb) => {
    const tenantId = req.user?.tenantId || "default";
    const dir = path.join(UPLOADS_ROOT, tenantId);
    ensureDir(dir);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${base}-${unique}${ext}`);
  },
});

const ALLOWED_MIMES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/bmp", "image/tiff",
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
  "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/aac",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "text/csv",
  "application/zip", "application/x-tar", "application/gzip",
]);

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not allowed`));
    }
  },
});

export function registerUploadRoutes(app: Express) {
  ensureDir(UPLOADS_ROOT);

  app.use("/uploads", (req, res, next) => {
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  }, express.static(UPLOADS_ROOT));

  app.post("/api/admin/media/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }

      const tenantId = req.user!.tenantId;
      const file = req.file;
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, "/");
      const url = `${baseUrl}/${relativePath}`;

      const asset = await storage.createMediaAsset({
        tenantId,
        uploadedByUserId: req.user!.id,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        url,
        alt: (req.body.alt as string) || null,
        tagsJson: req.body.tags ? JSON.stringify(
          (req.body.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean)
        ) : "[]",
        folder: (req.body.folder as string) || "",
      });

      log(`File uploaded: ${file.originalname} (${file.size} bytes) by user ${req.user!.id}`, "upload");
      res.json(asset);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/media/upload-multiple", requireAuth, upload.array("files", 20), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }

      const tenantId = req.user!.tenantId;
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const assets = [];

      for (const file of files) {
        const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, "/");
        const url = `${baseUrl}/${relativePath}`;

        const asset = await storage.createMediaAsset({
          tenantId,
          uploadedByUserId: req.user!.id,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          url,
          alt: null,
          tagsJson: "[]",
          folder: (req.body.folder as string) || "",
        });
        assets.push(asset);
      }

      log(`${files.length} files uploaded by user ${req.user!.id}`, "upload");
      res.json(assets);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });
}
