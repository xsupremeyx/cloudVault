const { body } = require("express-validator");
const { prisma } = require("../../lib/prisma");

const validateFolder = [
    body("name")
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage("Folder name must be 1-50 characters long.")
        .custom(async (value, { req }) => {
            const parentId = req.body.parentId
                ? parseInt(req.body.parentId, 10)
                : null;

            const currentFolderId = req.params.id
                ? parseInt(req.params.id, 10)
                : null;

            const folders = await prisma.folder.findMany({
                where: {
                    userId: req.user.id,
                    parentId,
                },
            });

            const duplicate = folders.find(
                folder =>
                    folder.name.toLowerCase() === value.toLowerCase() &&
                    folder.id !== currentFolderId
            );

            if (duplicate) {
                throw new Error(
                    "A folder with this name already exists here."
                );
            }

            return true;
        }),
];

module.exports = {
    validateFolder,
};