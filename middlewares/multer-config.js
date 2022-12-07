//import de multer
const multer = require('multer');
//on se créer un dictionnaire mimetype
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

//création d'un objet de configuration pour multer 
//fonction diskStorage de multer permet d'enregistrer sur le disk
//on lui passe deux éléments la fonction destination et filename
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    //appel de la fonction callback le premier argument null pour dire qu'il n'y a pas eut d'erreur à ce niveau là
    //le deuxième argument = nom du dossier
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    //génère le nouveau nom du fichier
    //les espaces peuvent poser problème côté serveur donc remplacement des espaces par '_'
    const name = file.originalname.split('.')[0].split(' ').join('_');
    //on doit appliquer une extension au fichier mais on y a pas accès
    //on a accès au mimetype (image/jpg ou image/png)
    //l'extension du ficher sera l'élément du dictionnaire qui correspond au mimetype du fichier envoyé par le front
    const extension = MIME_TYPES[file.mimetype];
    //appel de la fonction callback le premier argument null pour dire qu'il n'y a pas eut d'erreur à ce niveau là
    //création du nom du fichier entier : name + Date.now() + '.' + extension
    //Date.now() est un timestamp afin de rendre le nom du fichier le plus unique possible se sera à la milliseconde prés
    callback(null, name + Date.now() + '.' + extension);
  }
});

//export de multer
//appel de la fonction multer, on lui passe l'objet storage
//appel de la méthode single pour indiquer qu'il s'agit d'un fichier unique et non pas un ensemble
//'image' indique à multer que les fichiers envoyés sont des images
module.exports = multer({storage: storage}).single('image');