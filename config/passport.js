const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Modèle utilisateur

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            // Chercher l'utilisateur par email
            try {
                const user = await User.findOne({ email });
                if (!user) {
                    return done(null, false, { message: 'Email non enregistré.' });
                }

                // Vérifier le mot de passe
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Mot de passe incorrect.' });
                }
            } catch (err) {
                return done(err);
            }
        })
    );

    // Sérialisation de l'utilisateur dans la session
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Désérialisation de l'utilisateur depuis la session
    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
};
