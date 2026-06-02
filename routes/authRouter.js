const { Router } = require("express");
const authRouter = Router();

const authController = require("../controllers/authController");
const { validateSignUp, validateLogIn } = require("../middleware/validate");

authRouter.post("/log-out", authController.postLogOut);

authRouter.post(
    "/log-in",
    validateLogIn,
    authController.postLogIn
);


authRouter.get("/log-in", authController.getLogIn);
authRouter.get("/sign-up", authController.getSignUp);
authRouter.post("/sign-up", validateSignUp, authController.postSignUp);

module.exports = authRouter;