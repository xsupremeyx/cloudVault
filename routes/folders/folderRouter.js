const { Router } = require("express");
const folderRouter = Router();
const { ensureAuthenticated } = require("../../middleware/authMiddleware");

const folderController = require("../../controllers/folderController");

folderRouter.post("/", ensureAuthenticated, folderController.createFolder);
folderRouter.get("/:id", ensureAuthenticated, folderController.getFolder);
folderRouter.post("/:id/edit", ensureAuthenticated, folderController.renameFolder);

module.exports = folderRouter;