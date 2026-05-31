const { prisma } = require("../lib/prisma");

async function createFolder(req, res, next){
    try{
        const { name } = req.body;
        await prisma.folder.create({
            data: {
                name,
                userId: req.user.id,
            },
        })
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
        })
        if(!folder){
            const error = new Error("Folder not found");
            error.status = 404;
            throw error;
        }
        res.render("folder", {
            folder,
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

module.exports = {
    createFolder,
    getFolder,
    renameFolder,
}