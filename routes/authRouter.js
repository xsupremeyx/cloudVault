const { Router } = require("express");
const authRouter = Router();
const passport = require("passport");

const authController = require("../controllers/authController");

authRouter.post("/log-out", authController.postLogOut);
authRouter.post("/log-in", passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/log-in",
}));


authRouter.get("/log-in", authController.getLogIn);
authRouter.get("/sign-up", authController.getSignUp);
authRouter.post("/sign-up", authController.postSignUp);

module.exports = authRouter;