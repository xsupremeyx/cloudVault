const { body } = require("express-validator");
const { prisma } = require("../../lib/prisma");

const validateFolder = [
    body("name")
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage("Folder name must be 1-50 characters long.")
        .custom(async (value, { req }) => {
            const currentFolderId = req.params.id
                ? parseInt(req.params.id, 10)
                : null;

            let parentId = req.body.parentId
                ? parseInt(req.body.parentId, 10)
                : null;

            if (currentFolderId) {
                const currentFolder = await prisma.folder.findUnique({
                    where: {
                        id: currentFolderId,
                    },
                    select: {
                        parentId: true,
                    },
                });

                if (currentFolder) {
                    parentId = currentFolder.parentId;
                }
            }

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