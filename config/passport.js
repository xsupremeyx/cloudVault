const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const { prisma } = require("../lib/prisma");
const bcrypt = require("bcryptjs");

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try{
            const users = await prisma.user.findMany();

            const user = users.find(
                user =>
                    user.username.toLowerCase() === username.toLowerCase()
            );
            if(!user){
                return done(null, false)
            }

            const match = await bcrypt.compare(password, user.password);
            if(!match){
                return done(null,false);
            }

            return done(null, user);
        }
        catch(error){
            return done(error);
        }
    })
)

passport.serializeUser((user, done) => {
    return done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try{
        const user = await prisma.user.findUnique({
            where: { id, },
            select: { 
                id: true,
                username: true,
            },
        });
        return done(null, user);
    }   
    catch(error){
        return done(error);
    }
})

module.exports = passport;