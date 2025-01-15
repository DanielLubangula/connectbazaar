// Importation des modules nécessaires
require('dotenv').config(); // Charger les variables d'environnement
const express = require("express");
const { engine } = require("express-handlebars");
const mongoose = require("mongoose");
const path = require('path');
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require('passport'); // Authentification avec Passport
const cors = require("cors");
const handlebars = require('handlebars');
const route = require('./routes/userRoutes');
const db = require("./config/db");
const app = express();
const User = require("./models/User");

require("./auth"); // Fichier de configuration Passport

// Configuration de la session pour Express
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET, // Récupéré depuis .env
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 jour
    httpOnly: true, // Sécurise le cookie
  },
});
app.use(sessionMiddleware);

// Initialisation de Passport (après la session)
app.use(passport.initialize());
app.use(passport.session());


// Démarrer l'authentification via Google
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback après l'authentification
// Callback après l'authentification
app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/auth/failure" }),
  async (req, res) => {
    // Vérifiez si l'utilisateur est nouveau
    if (req.user.isNewUser) {
      console.log("Nouvel utilisateur détecté :", req.user.user);
      // Redirigez vers une page d'inscription ou d'informations supplémentaires
      return res.redirect("/deliver/registerLogin"); 
    }

    // Si l'utilisateur existe déjà, connectez-le
    req.session.user = req.user.user;
    console.log("Utilisateur connecté :", req.user.user); // Doit afficher l'utilisateur
    res.redirect("/deliver");
  }
);

app.get("/auth/failure", (req, res) => {
  req.logout();
  req.session.destroy();
  res.send("Il y a une erreur");
});


// Initialisation de l'application
const http = require('http').createServer(app); // Création d'un serveur HTTP
const io = require("socket.io")(http); // Intégration de Socket.io avec le serveur HTTP

// Configuration de Passport
require('./config/passport')(passport); 

// Configuration du moteur de templates Handlebars
app.engine(
  "handlebars",
  engine({
    handlebars: handlebars, // Utilise l'instance Handlebars avec les helpers
  })
);
app.set("view engine", "handlebars");

// Enregistrement d'un helper Handlebars pour les objets JSON
handlebars.registerHelper("eq", (a, b) => a === b);
handlebars.registerHelper('json', (context) => JSON.stringify(context));

// Middleware global
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));
app.use(express.static("uploads"));
app.use(express.static("public"));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());


// Passez la session middleware à Socket.IO
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});


// Middleware pour les messages flash
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.vendor = req.session.vendor || null;
  res.locals.admin = req.session.admin || null;
  next();
});


// Connexion à la base de données MongoDB
db.connect();

// Routes principales
app.use("/deliver", route);

// Configuration de Socket.io
require('./socket/socket')(io);

// initialisation de l'admin
//require("./config/initAdmin")()

const corsOrigins = process.env.CORS_ORIGIN.split(',');
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Ajouter les méthodes nécessaires
  credentials: true, // Si vous utilisez des cookies ou des sessions
})); 

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
http.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
