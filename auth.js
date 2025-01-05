const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const User = require("./models/User"); // Modèle utilisateur

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://deliver-jvwl.onrender.com/auth/google/callback",
      passReqToCallback: true,
    },
    async (request, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.email });

        // Si l'utilisateur n'existe pas, on le crée
        if (!user) {
          user = new User({
            username: profile.displayName,
            email: profile.email,
            googleId: profile.id,
          });
          await user.save();
        }

        // Terminer l'authentification
        return done(null, user);
      } catch (err) {
        console.error("Erreur OAuth:", err);
        return done(err, null);
      }
    }
  )
);

// Sérialisation de l'utilisateur dans la session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
