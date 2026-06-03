const { Router } = require("express");
const shareController = require("../controllers/shareController");

const shareRouter = Router();


shareRouter.get(
    "/:token/files/:fileId/download",
    shareController.downloadSharedFile
);

shareRouter.get(
    "/:token/folders/:folderId",
    shareController.getSharedSubfolder
);

shareRouter.get(
    "/:token",
    shareController.getSharedFolder
);

module.exports = shareRouter;