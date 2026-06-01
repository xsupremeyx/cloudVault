const {prisma} = require("../lib/prisma");
const path = require("node:path");
const fs = require("node:fs/promises");

async function uploadFile(req, res, next){
    try{
        const folderId = parseInt(req.params.id,10);
        const folder = await prisma.folder.findFirst({
            where: {
                id: folderId,
                userId: req.user.id,
            },
        });

        if(!folder){
            const error = new Error("Folder not found");
            error.status = 404;
            throw error;
        }

        if(!req.file){
            const error = new Error("No file uploaded");
            error.status = 400;
            throw error;
        }

        await prisma.file.create({
            data: {
                name: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype,
                url: req.file.path,
                folderId: folder.id,
                userId: req.user.id,
            },
        });
        res.redirect(`/folders/${folderId}`);
    }
    catch(error){
        next(error);
    }
}


async function downloadFile(req, res, next){
    try{
        const fileId = parseInt(req.params.fileId, 10);
        if (isNaN(fileId)){
            const error = new Error("Invalid file ID");
            error.status = 404;
            throw error;
        }

        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId: req.user.id,
            },
        });

        if(!file){
            const error = new Error("File not found");
            error.status = 404;
            throw error;
        }

        const filePath = path.resolve(file.url);
        res.download(filePath, file.name);
    }
    catch(error){
        next(error);
    }
}


async function deleteFile(req, res, next){
    try{
        const fileId = parseInt(req.params.fileId, 10);
        if (isNaN(fileId)){
            const error = new Error("Invalid file ID");
            error.status = 404;
            throw error;
        }

        const file = await prisma.file.findFirst({
            where: {
                id: fileId,
                userId: req.user.id,
            },
        });

        if(!file){
            const error = new Error("File not found");
            error.status = 404;
            throw error;
        }

        const folderId = file.folderId;
        const filePath = path.resolve(file.url);
        await fs.unlink(filePath);
        await prisma.file.delete({
            where: {
                id: file.id,
            },
        });
        res.redirect(`/folders/${folderId}`);
    }
    catch(error){
        next(error);
    }
}

module.exports = {
    uploadFile,
    downloadFile,
    deleteFile,
};