const { Router } = require("express");
const folderRouter = Router();
const { ensureAuthenticated } = require("../../middleware/authMiddleware");
const upload = require("../../config/multer");

const { validateFolder } = require("../../middleware/validate");

const folderController = require("../../controllers/folderController");
const fileController = require("../../controllers/fileController");

folderRouter.post("/", ensureAuthenticated, validateFolder, folderController.createFolder);

folderRouter.post("/:id/files", ensureAuthenticated, upload.single("file"), fileController.uploadFile);
folderRouter.get("/files/:fileId/download", ensureAuthenticated, fileController.downloadFile);
folderRouter.post("/files/:fileId/delete", ensureAuthenticated, fileController.deleteFile);

folderRouter.get("/:id", ensureAuthenticated, folderController.getFolder);
folderRouter.post("/:id/edit", ensureAuthenticated, folderController.renameFolder);
folderRouter.post("/:id/delete", ensureAuthenticated, folderController.deleteFolder);
module.exports = folderRouter;