//importation de Express en créant une const express
const express = require('express');
//contiendra l'application, on appel la méthode express() ce qui permettra de créer une application express
const app = express();

// Gestion des headers
const helmet = require('helmet');

const path = require('path');
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const commentsRoutes = require('./routes/comments');

// Récupération de la config via le .env situé dans le dossier config
require('dotenv').config({ path : './config/.env' });

// Ajout d'express rate limit, permet de limiter le nombre de requêtes dans un temps défini
const rateLimiter = require('express-rate-limit');
const limiter = rateLimiter({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 50, // Limiter l'ip à faire 50 requêtes par window (ici 1mn)
	standardHeaders: true, // Retourne `RateLimit-*` dans les headers
	legacyHeaders: false, // Désactiver les headers `X-RateLimit-*`
})

//import de mongoose
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));
  
/*Permet d'accéder au corps de la requête
ce middleware intercepte toute les requêtes qui on un contenu de type JSON
et met à disposition ce contenu (ou corps de la requête) sur l'objet requête dans req.body
une méthode plus ancienne permet de faire la même chose (bodyParser)*/
app.use(express.json());

/*ce middleware permet d'ajouter un header (setHeader) au objet (ces header palie au problème de CORS)
c'est un middleware générale c'est-à-dire qu'on ajoute pas de route spécifique
*/
app.use((req, res, next) => {
    //'Access-Control-Allow-Origin' = origine, '*' = tout le monde
    //origine qui a le droit d'accéder à l'API c'est tout le monde
    res.setHeader('Access-Control-Allow-Origin', '*');
    //autorisation d'utiliser certains Headers sur l'objet requête
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    //autorisation d'utiliser certaines méthodes (verbes de requête)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

// Autorise la récupération de ressources depuis le même site
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Appliquer le limiteur
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);

//utilisation du middleware static fournit par express
app.use('/images', express.static(path.join(__dirname, 'images')));

//permet d'exporter l'application/constante pour qu'elle soit accessible depuis les autres fichiers (notamment le serveur node)
module.exports = app;