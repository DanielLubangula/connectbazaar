const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const User = require("./models/User"); // Modèle utilisateur

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://connectbazaar.onrender.com/auth/google/callback",
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.email });
        let isNewUser = false;

        // Si l'utilisateur n'existe pas, on le crée
        if (!user) {
          isNewUser = true;
        }

        // Attacher `isNewUser` pour la redirection
        return done(null, { user, isNewUser });
      } catch (err) {
        console.error("Erreur OAuth:", err);
        return done(err, null);
      }
    }
  )
);


passport.serializeUser((userObject, done) => {
  done(null, { id: userObject.user.id, isNewUser: userObject.isNewUser });
});

passport.deserializeUser(async (obj, done) => {
  try {
    const user = await User.findById(obj.id);
    done(null, { user, isNewUser: obj.isNewUser });
  } catch (err) {
    done(err, null);
  }
});
