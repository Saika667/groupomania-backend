//import
const jwt = require('jsonwebtoken');

//permet de vérifier qu'à chaque requête l'utilisateur est authentifier
//export de la fonction qui est la middleware
module.exports = (req, res, next) => {
   try {
        //récupération du token
       const token = req.headers.authorization.split(' ')[1];
       //décodage du token avec verify
       const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET_KEY');
       //récupère le userId décodé
       const userId = decodedToken.userId;
       //cette objet est transmis au route par la suite
       req.auth = {
           userId: userId
       };
	next();
   } catch(error) {
       res.status(401).json({ error });
   }
};