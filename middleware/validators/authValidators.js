const { body } = require("express-validator");
const { prisma } = require("../../lib/prisma");

const validateSignUp = [
    body("username")
        .notEmpty()
        .withMessage("Username is required.")
        .bail()
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be 3-30 characters long.")
        .bail()
        .matches(/^[A-Za-z0-9_]+$/)
        .withMessage("Username may only contain letters, numbers, and underscores.")
        .bail()
        .custom(async (value) => {
            const duplicate = await prisma.user.findFirst({
                where: {
                    username: {
                        equals: value,
                        mode: "insensitive",
                    },
                },
            });

            if (duplicate) {
                throw new Error("Username is already taken.");
            }

            return true;
        }),

    body("password")
        .notEmpty()
        .withMessage("Password is required.")
        .bail()
        .matches(/^(?=.*[A-Za-z])(?=.*\d)[^\s]{8,}$/)
        .withMessage(
            "Password must be at least 8 characters, contain at least one letter and one number, and cannot contain spaces."
        )
        .bail(),

    body("confirmPassword")
        .notEmpty()
        .withMessage("Please confirm your password.")
        .bail()
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("Passwords do not match.");
            }

            return true;
        }),
];

const validateLogIn = [
    body("username")
        .notEmpty()
        .withMessage("Username is required.")
        .bail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required.")
        .bail(),
];

module.exports = {
    validateSignUp,
    validateLogIn,
};