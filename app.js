const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const path = require("node:path");

// import session
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

// prisma 
const { prisma } = require("./lib/prisma");

// import passport
const passport = require("./config/passport");

// app declare
const app = express();

// add view engine of ejs
app.set("views", path.join(__dirname,"views"));
app.set("view engine", "ejs");

// configure public assets and form parsing
const assetsPath = path.join(__dirname, "public");
app.use(express.static(assetsPath));
app.use(express.urlencoded({ extended: true }));

// session middleware
app.use(
    session({
        store: new PrismaSessionStore(prisma, {
            checkPeriod: 2*60*1000,
            dbRecordIdIsSessionId: true,
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 30*24*60*60*1000, // 30 days
        },
    })
);

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// add user to res.locals for easy access in views
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

// import routes
const indexRouter = require("./routes/indexRouter");
const authRouter = require("./routes/authRouter");

// define routes
app.use("/", authRouter);
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

const PORT = process.env.PORT || 3000
app.listen(PORT, (err) => {
    if(err){
        console.error("Error starting server:", err);
        return;
    }
    console.log(`Server is running on port ${PORT}`);
})