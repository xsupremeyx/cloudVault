const {prisma} = require("../lib/prisma");

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

module.exports = {
    uploadFile,
};