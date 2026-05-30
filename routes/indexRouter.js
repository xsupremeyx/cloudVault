const { Router } = require("express");
const indexRouter = Router();
const { ensureAuthenticated } = require("../middleware/authMiddleware");


// import controllers
const indexController = require("../controllers/indexController");

// define routes
indexRouter.get("/dashboard", ensureAuthenticated, indexController.getDashboard);
indexRouter.get("/", indexController.getIndex);

module.exports = indexRouter;