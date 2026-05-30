
function getIndex(req, res, next) {
    try {
        res.render("index");
    }
    catch (error) {
        next(error);
    }
}

function getDashboard(req, res, next) {
    try {
        res.render("dashboard");
    }
    catch (error) {
        next(error);
    }
}

module.exports = {
    getIndex,
    getDashboard,    
}