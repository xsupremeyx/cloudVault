const { prisma } = require("../lib/prisma");

async function isDescendantFolder(rootFolderId, targetFolderId) {
    let currentFolder = await prisma.folder.findUnique({
        where: {
            id: targetFolderId,
        },
        select: {
            id: true,
            parentId: true,
        },
    });

    while (currentFolder) {
        if (currentFolder.id === rootFolderId) {
            return true;
        }

        if (!currentFolder.parentId) {
            return false;
        }

        currentFolder = await prisma.folder.findUnique({
            where: {
                id: currentFolder.parentId,
            },
            select: {
                id: true,
                parentId: true,
            },
        });
    }

    return false;
}

async function buildSharedBreadcrumbs(
    rootFolderId,
    folder
) {
    const breadcrumbs = [];

    let currentFolder = folder;

    while (currentFolder) {
        breadcrumbs.push({
            id: currentFolder.id,
            name: currentFolder.name,
        });

        if (currentFolder.id === rootFolderId) {
            break;
        }

        currentFolder = await prisma.folder.findUnique({
            where: {
                id: currentFolder.parentId,
            },
            select: {
                id: true,
                name: true,
                parentId: true,
            },
        });
    }

    return breadcrumbs.reverse();
}

async function getDescendantFolderIds(folderId) {
    const ids = [folderId];

    const children = await prisma.folder.findMany({
        where: {
            parentId: folderId,
        },
        select: {
            id: true,
        },
    });

    for (const child of children) {
        const childIds = await getDescendantFolderIds(child.id);
        ids.push(...childIds);
    }

    return ids;
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
    isDescendantFolder,
    buildSharedBreadcrumbs,
    getDescendantFolderIds,
    buildBreadcrumbs,
};