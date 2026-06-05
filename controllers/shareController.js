const { prisma } = require("../lib/prisma");

const { buildSharedBreadcrumbs, isDescendantFolder } = require("../utils/folderTree");

// helper
async function getValidShare(token) {
    const share = await prisma.share.findUnique({
        where: {
            token,
        },
    });

    if (!share) {
        const error = new Error("Share link not found");
        error.status = 404;
        throw error;
    }

    if (share.expiresAt < new Date()) {
        const error = new Error("Share link has expired");
        error.status = 410;
        throw error;
    }

    return share;
}

async function createShare(req, res, next) {
    try {
        const folderId = parseInt(req.params.id, 10);

        if (isNaN(folderId)) {
            const error = new Error("Invalid folder ID");
            error.status = 400;
            throw error;
        }

        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id,
            },
        });

        if (!folder) {
            const error = new Error("Folder not found");
            error.status = 404;
            throw error;
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.share.upsert({
            where: {
                folderId,
            },
            update: {
                expiresAt,
            },
            create: {
                folderId,
                expiresAt,
            },
        });
        res.redirect(`/folders/${folderId}`);

    } catch (error) {
        next(error);
    }
}

async function getSharedFolder(req, res, next) {
    try {
        const { token } = req.params;

        const share = await getValidShare(token);

        const folder = await prisma.folder.findUnique({
            where: {
                id: share.folderId,
            },
            include: {
                children: true,
                files: true,
            },
        });

        if (!folder) {
            const error = new Error("Shared folder no longer exists");
            error.status = 404;
            throw error;
        }

        const breadcrumbs =
            await buildSharedBreadcrumbs(
                share.folderId,
                folder
            );

        res.render("share", {
            title: folder.name,
            folder,
            token,
            breadcrumbs,
        });

    } catch (error) {
        next(error);
    }
}

async function getSharedSubfolder(req, res, next) {
    try {
        const { token } = req.params;
        const folderId = parseInt(req.params.folderId, 10);

        if (isNaN(folderId)) {
            const error = new Error("Invalid folder ID");
            error.status = 404;
            throw error;
        }

        const share = await getValidShare(token);

        const allowed = await isDescendantFolder(
            share.folderId,
            folderId
        );

        if (!allowed) {
            const error = new Error("Folder not found");
            error.status = 404;
            throw error;
        }

        const folder = await prisma.folder.findUnique({
            where: {
                id: folderId,
            },
            include: {
                children: true,
                files: true,
            },
        });

        if (!folder) {
            const error = new Error("Folder not found");
            error.status = 404;
            throw error;
        }

        const breadcrumbs =
            await buildSharedBreadcrumbs(
                share.folderId,
                folder
            );

        res.render("share", {
            title: folder.name,
            folder,
            token,
            breadcrumbs,
        });

    } catch (error) {
        next(error);
    }
}

async function downloadSharedFile(req, res, next) {
    try {
        const { token } = req.params;
        const fileId = parseInt(req.params.fileId, 10);

        if (isNaN(fileId)) {
            const error = new Error("Invalid file ID");
            error.status = 404;
            throw error;
        }

        const share = await getValidShare(token);

        const file = await prisma.file.findUnique({
            where: {
                id: fileId,
            },
        });

        if (!file) {
            const error = new Error("File not found");
            error.status = 404;
            throw error;
        }

        const allowed = await isDescendantFolder(
            share.folderId,
            file.folderId
        );

        if (!allowed) {
            const error = new Error("File not found");
            error.status = 404;
            throw error;
        }

        return res.redirect(file.url);

    } catch (error) {
        next(error);
    }
}

module.exports = {
    createShare,
    getSharedFolder,
    getSharedSubfolder,
    downloadSharedFile,
};