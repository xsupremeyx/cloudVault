const { body } = require("express-validator");

const validateFolder = [
    body("name")
        .trim()
        .isLength({ min: 1, max: 50})
        .withMessage("Folder name must be 1-50 characters long."),
];

module.exports = {
    validateFolder,
};