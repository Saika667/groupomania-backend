//import du model
const Posts = require('../models/posts');
const Users = require('../models/users');
const Likes = require('../models/likes');
const Comments = require('../models/comments');

const fs = require('fs');
const path = require('path');

exports.create = (req, res, next) => {
    const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : '';
    const post = new Posts({
        // On récupère l'id de l'utilisateur connecté grâce au middleware auth
        // Pas confiance aux données pouvant être modifiées par l'utilisateur ->
        // Le middleware récupère l'id grâce au jsonwebtoken passé en authorization de la requête
        authorId: req.auth.userId,
        // updated_datetime ayant une valeur par défaut on passe le body et createdDatetime
        createdDatetime: new Date(),
        imageUrl,
        ...req.body
    });

    post.save()
        .then(() => res.status(201).json({ message: 'Création de post effectuée !'}))
        //error dans json est écrit sous forme de raccourci c'est la même chose que 'error: error'
        .catch(error => res.status(400).json({ error }));
}

exports.getAll = (req, res, next) => {
    // Find avec objet vide car on veut tous les posts
    // '_id': 0 signifie qu'on ne récupère pas cet attribut
    // sort -> Tri, -1 -> tri descendant
    // limit 20 = récupère les 20 premiers
    //.lean() permet d'obtenir un objet javascript et pas un document mongo
    Posts.find({}, {__v: 0}).sort({createdDatetime : -1}).limit(20).lean()
        .then(async posts => {
            const promise = new Promise((resolve, reject) => {
                let index = 0;
                let maxIndex = posts.length;
                for(let post of posts) {
                    Likes.findOne({likerId: req.auth.userId, postId: post._id})
                        .then(like => {
                            post.hasUserLiked = like !== null && like.status === 1 ? 1 : 0;
                        })
                        .catch(error => res.status(400).json({ error }));
                    Users.findOne({_id: post.authorId}, {email: 0, password:0, __v: 0})
                        .then(user => {
                            post.user = user;
                            index++;
                            delete post.authorId;
                            if (index === maxIndex) {
                                resolve();
                            }
                        })
                        .catch(error => res.status(400).json({ error }));
                }
            })

            promise
                .then(function(){res.status(200).json(posts);})
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
}

exports.likeUnLike = (req, res, next) => {
    // On récupère le post sur lequel l'utilisateur veut réagir
    Posts.findOne({_id: req.params.postId})
        .then(post => {
            // On regarde s'il existe déjà un document Like en base
            // Document contenant le postId + likerId correspondant
            Likes.findOne({postId: req.params.postId, likerId: req.auth.userId})
                .then(like => {
                    // Le like n'existe pas, on le crée avec ce que le back reçoit
                    if (like === null) {
                        like = new Likes({
                            postId: req.params.postId,
                            likerId: req.auth.userId,
                            status: req.body.status
                        })
                        post.numberLike++;
                    } else {
                        // Statut représente l'état du like (1 = a liké, 0 = a unliké)
                        // Le like existe déjà, on fait des tests pour savoir si on doit décrémenter/incrémenter
                        // Si l'utilisateur ne veut plus like et que le statut du document est à 1
                        // Alors on peut décrémenter et changer le statut
                        //req.body.status correspond au statut de la requête envoyé et like.status correspond 
                        //au statut précédent enregistré dans la base de donnée
                        if (req.body.status === 0 && like.status === 1) {
                            post.numberLike--;
                            like.status = 0;
                        } 
                        // Si l'utilisateur veut plus like et que le statut du document est à 0
                        // Alors on peut incrémenter et changer le statut
                        else if(req.body.status === 1 && like.status === 0) {
                            post.numberLike++;
                            like.status = 1;
                        } 
                        // L'utilisateur veut décrémenter/incrémenter en masse, on le bloque
                        else {
                            res.status(400).json({ message: "Like/Unlike déjà effectué"});
                            return;
                        }
                    }

                    // On imbrique pour s'assurer que la sauvegarde précédente a bien été effectuée
                    post.save()
                        .then(() => {
                            like.save()
                                .then(() => {res.status(201).json({ message: "Like enregistré" });})
                                .catch(error => res.status(400).json({ error }));
                        })
                        .catch(error => res.status(400).json({ error }));
                })
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
}

exports.delete = (req, res, next) => {
    //la promesse sert à déterminer si l'utilisateur est admin ou propriétaire du post
    const promise = new Promise((resolve, reject) => {
        Posts.findOne({_id: req.params.postId})
            .then((post) => {
                // toString car post.authorId est un ObjectId et req.auth.userId une string
                if (post.authorId.toString() === req.auth.userId) {
                    resolve();
                } else {
                    Users.findOne({_id: req.auth.userId})
                        .then((user) => {
                            if (user.isAdmin) {
                                resolve();
                            }
                            reject("Vous n'êtes pas autorisé à faire cette action.");
                        })
                        .catch(error => res.status(400).json({ error }));
                }
            })
            .catch(error => res.status(400).json({ error }));
    });

    promise
        .then(() => {
            Posts.deleteOne({_id: req.params.postId})
                .then(() => {
                    Comments.deleteMany({postId: req.params.postId})
                        .then(() => {
                            Likes.deleteMany({postId: req.params.postId})
                                .then(() => {res.status(201).json({ message: "Post supprimé" });})
                                .catch(error => res.status(400).json({ error }));
                        })
                        .catch(error => res.status(400).json({ error }));
                })
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(403).json({ error }));
}

exports.modify = async (req, res, next) => {
    //si req.file (=si un fichier à été passer et multer n'autorise que les images) existe
    //alors req.protocol (=correspond en général à HTTP ou HTTPS)
    //req.get('host') permet d'ajouter ce qu'il y a entre '://' et '/images/' dans notre cas : localhost:3000
    //req.file.filename représente le nom du fichier 
    //cela donne des noms de ficher comme suit : http://localhost:3000/images/nomFichier.jpg
    //si pas de fichier alors string vide
    const imageUrl = req.file ? `${req.protocol}://${req.get('host')}/images/${req.file.filename}` : '';
    const updatePost = {
        ...req.body
    };

    const post = await Posts.findOne({_id: req.params.postId});
    //req.file !== undefined : on passe un fichier dans la requête donc on veut supp l'ancien
    // req.body.image === '' : si c'est string vide on souhaite supprimer l'ancienne photo 
    // post.imageUrl !== '' : correspond à l'image enregistré précédemment si il y en a une
    if((req.file !== undefined || req.body.image === '') && post.imageUrl !== '') {
        // On crée un objet url depuis la string sauvegardée pour pouvoir accéder à .pathname
        const url = new URL(post.imageUrl);
        const imagePath = url.pathname;
        
        // On supprime l'ancienne image, __dirname = répertoire courant
        fs.unlinkSync(path.join(__dirname, `..${imagePath}`));
    }

    updatePost.imageUrl = imageUrl;
    
    Posts.findOneAndUpdate({_id: req.params.postId}, updatePost)
        .then(() => {res.status(200).json({message: "Post modifié avec succès"})})
        .catch(error => { res.status(400).json({error })});

}