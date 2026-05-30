const bcrypt = require("bcryptjs");
const { prisma } = require("../lib/prisma");

function getSignUp(req, res, next) {
    try {
        res.render("sign-up");
    }
    catch (error) {
        next(error);
    }
}

async function postSignUp(req, res, next) {
    try {
        const { username, password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.redirect("/sign-up");
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                username,
            },
        });
        if (existingUser) {
            return res.redirect("/sign-up");
        }
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