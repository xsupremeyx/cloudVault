const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");
const { validationResult } = require("express-validator");

function getSignUp(req, res, next) {
    try {
        res.render("sign-up", {
            errors: [],
            data: {},
        });
    }
    catch (error) {
        next(error);
    }
}

async function postSignUp(req, res, next) {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).render("sign-up", {
                errors: errors.array(),
                data: req.body,
            });
        }

        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        res.redirect("/log-in");
    }
    catch (error) {
        next(error);
    }
}

function getLogIn(req, res, next) {
    try {
        res.render("log-in");
    }
    catch (error) {
        next(error);
    }
}

function postLogOut(req, res, next) {
    req.logout((error) => {
        if (error) {
            return next(error);
        }

        res.redirect("/");
    });
}

module.exports = {
    getSignUp,
    postSignUp,
    getLogIn,
    postLogOut,
}