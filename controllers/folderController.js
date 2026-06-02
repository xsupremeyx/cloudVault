const { prisma } = require("../lib/prisma");
const { validationResult } = require("express-validator");
const { formatFileSize } = require("../utils/formatFileSize");

async function createFolder(req, res, next) {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {

            const { parentId } = req.body;

            if (parentId) {

                const folder = await prisma.folder.findFirst({
                    where: {
                        id: parseInt(parentId, 10),
                        userId: req.user.id,
                    },
                    include: {
                        children: true,
                        parent: true,
                        files: true,
                    },
                });

                const breadcrumbs = await buildBreadcrumbs(folder);

                return res.status(400).render("folder", {
                    folder,
                    breadcrumbs,
                    errors: errors.array(),
                    data: req.body,
                    formType: "childFolder",
                });
            }

            const folders = await prisma.folder.findMany({
                where: {
                    userId: req.user.id,
                    parentId: null,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });

            return res.status(400).render("dashboard", {
                folders,
                errors: errors.array(),
                data: req.body,
            });
        }
        const { name, parentId } = req.body;
        let parentFolder = null;
        if (parentId) {
            parentFolder = await prisma.folder.findFirst({
                where: {
                    id: parseInt(parentId, 10),
                    userId: req.user.id,
                },
            });
        }

        if (parentId && !parentFolder) {
            const error = new Error("Parent folder not found");
            error.status = 404;
            throw error;
        }
        await prisma.folder.create({
            data: {
                name,
                userId: req.user.id,
                parentId: parentId ? parseInt(parentId, 10) : null,
            },
        })
        if (parentId) {
            return res.redirect(`/folders/${parentId}`);
        }

        res.redirect("/dashboard");
    }
    catch (error) {
        next(error);
    }
}

async function getFolder(req, res, next) {
    try {
        const folderId = parseInt(req.params.id, 10);
        if (isNaN(folderId)) {
            const error = new Error("Invalid folder ID");
            error.status = 404;
            throw error;
        }
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id,
            },
            include: {
                children: true,
                parent: true,
                files: true,
            }
        })
        if (!folder) {
            const error = new Error("Folder not found");
            error.status = 404;
            throw error;
        }

        folder.files.forEach(file => {
            file.formattedSize = formatFileSize(file.size);
        });

        const breadcrumbs = await buildBreadcrumbs(folder);
        res.render("folder", {
            folder,
            breadcrumbs,
            errors: [],
            data: {},
            formType: null,
        });
    }
    catch (error) {
        next(error);
    }
}

async function renameFolder(req, res, next) {
    try {
        const folderId = parseInt(req.params.id, 10);
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const folder = await prisma.folder.findFirst({
                where: {
                    id: folderId,
                    userId: req.user.id,
                },
                include: {
                    children: true,
                    parent: true,
                    files: true,
                },
            });
            folder.files.forEach(file => {
                file.formattedSize = formatFileSize(file.size);
            });

            const breadcrumbs = await buildBreadcrumbs(folder);

            return res.status(400).render("folder", {
                folder,
                breadcrumbs,
                errors: errors.array(),
                data: req.body,
                formType: "rename",
            });
        }

        if (isNaN(folderId)) {
            const error = new Error("Invalid folder ID");
            error.status = 404;
            throw error;
        }
        const { name } = req.body;
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id,
            },
        })
        if (!folder) {
            const error = new Error("Folder not found");
            error.status = 404;
            throw error;
        }
        await prisma.folder.update({
            where: {
                id: folderId,
            },
            data: {
                name,
            },
        });
        res.redirect(`/folders/${folderId}`);

    }
    catch (error) {
        next(error);
    }
}

async function deleteFolder(req, res, next) {
    try {
        const folderId = parseInt(req.params.id, 10);
        if (isNaN(folderId)) {
            const error = new Error("Invalid folder ID");
            error.status = 404;
            throw error;
        }
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id,
            },
            include: {
                parent: true,
            },
        })
        if (!folder) {
            const error = new Error("Folder not found");
            error.status = 404;
            throw error;
        }
        await prisma.folder.delete({
            where: {
                id: folderId,
            },
        });
        if (folder.parent) {
            return res.redirect(`/folders/${folder.parent.id}`);
        }

        res.redirect("/dashboard");

    }
    catch (error) {
        next(error);
    }
}

async function buildBreadcrumbs(folder) {
    const breadcrumbs = [];
    let currentFolder = folder;
    while (currentFolder) {
        // add current folder to breadcrumbs
        breadcrumbs.push({
            id: currentFolder.id,
            name: currentFolder.name,
        });
        // stop if root
        if (!currentFolder.parentId) {
            break;
        }
        // fetch parent folder
        const parentFolder = await prisma.folder.findUnique({
            where: {
                id: currentFolder.parentId,
            },
        });
        // move up one level
        currentFolder = parentFolder;
    }
    // reverse to get correct order
    return breadcrumbs.reverse();
}

module.exports = {
    createFolder,
    getFolder,
    renameFolder,
    deleteFolder,
}