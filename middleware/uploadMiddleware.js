const upload = require("../config/multer");

const uploadSingleFile = (req, res, next) => {
    upload.single("file")(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error.code === "LIMIT_FILE_SIZE") {
            req.uploadError =
                "File exceeds the maximum size of 10 MB.";
        } else {
            req.uploadError = error.message;
        }

        return next();
    });
};

module.exports = {
    uploadSingleFile,
};