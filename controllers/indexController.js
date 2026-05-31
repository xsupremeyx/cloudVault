const { prisma } = require("../lib/prisma");
function getIndex(req, res, next) {
    try {
        res.render("index");
    }
    catch (error) {
        next(error);
    }
}

async function getDashboard(req, res, next) {
    try {
        const folders = await prisma.folder.findMany({
            where: {
                userId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            }
        })
        res.render("dashboard", {
            folders,
        });
    }
    catch (error) {
        next(error);
    }
}

module.exports = {
    getIndex,
    getDashboard,    
}