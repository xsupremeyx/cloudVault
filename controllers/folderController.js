const { prisma } = require("../lib/prisma");

async function createFolder(req, res, next){
    try{
        const { name, parentId } = req.body;
        let parentFolder = null;
        if(parentId){
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
    catch(error){
        next(error);
    }
}

async function getFolder(req, res, next){
    try{
        const folderId = parseInt(req.params.id,10);
        if(isNaN(folderId)){
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
        if(!folder){
            const error = new Error("Folder not found");
            error.status = 404;
            throw error;
        }
        const breadcrumbs = await buildBreadcrumbs(folder);
        res.render("folder", {
            folder,
            breadcrumbs,
        });
    }
    catch(error){
        next(error);
    }
}

async function renameFolder(req, res, next) {
    try {
        const folderId = parseInt(req.params.id,10);
        if(isNaN(folderId)){
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
        if(!folder){
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
    catch(error) {
        next(error);
    }
}

async function deleteFolder(req, res, next) {
    try {
        const folderId = parseInt(req.params.id,10);
        if(isNaN(folderId)){
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
        if(!folder){
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
    catch(error) {
        next(error);
    }
}

async function buildBreadcrumbs(folder) {
    const breadcrumbs = [];
    let currentFolder = folder;
    while(currentFolder){
        // add current folder to breadcrumbs
        breadcrumbs.push({
            id: currentFolder.id,
            name: currentFolder.name,
        });
        // stop if root
        if(!currentFolder.parentId){
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