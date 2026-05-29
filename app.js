const express = require("express");
const app = express();
const path = require("node:path");
app.set("views", path.join(__dirname,"views"));
app.set("view engine", "ejs");
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));

// import routes
const indexRouter = require("./routes/indexRouter");

// define routes
app.use("/", indexRouter);

// 404 handler
app.use((req, res, next) => {
    res.status(404).send("404 Not Found");
})

// global error handler
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).send("Internal Server Error");
})

const PATH = process.env.PORT || 3000
app.listen(PATH, (err) => {
    if(err){
        console.error("Error starting server:", err);
        return;
    }
    console.log(`Server is running on port ${PATH}`);
})