const Users = require('../models/users');
const Likes = require('../models/likes');
const Posts = require('../models/posts');
const Comments = require('../models/comments');

const fs = require('fs');
const path = require('path');

exports.getAll = (req, res, next) => {
    Users.find({}, {__v: 0}).sort({lastName : 1}).limit(20).lean()
        .then(function(users) {res.status(200).json(users);})
        .catch(error => res.status(400).json({ error }));
};

exports.getOne = (req, res, next) => {
    Users.findOne({_id: req.params.userId})
        .then(user => {res.status(200).json({user});})
        .catch(error => { res.status(400).json({ error });});
}

exports.modify = (req, res, next) => {
    let lastName = req.body.lastName.charAt(0).toUpperCase() + req.body.lastName.slice(1);
    let firstName = req.body.firstName.charAt(0).toUpperCase() + req.body.firstName.slice(1);
    let job = req.body.job.charAt(0).toUpperCase() + req.body.job.slice(1);
    delete req.body.lastName;
    delete req.body.firstName;
    delete req.body.job;
    const updatedUser = {
        lastName,
        firstName,
        job,
        ...req.body
    };

    if (req.file !== undefined) {
        Users.findOne({_id: req.auth.userId})
            .then((user) => {
                // On crée un objet url depuis la string sauvegardée pour pouvoir accéder à .pathname
                const url = new URL(user.profileImage);
                const imagePath = url.pathname;

                // On supprime l'ancienne image, __dirname = répertoire courant
                fs.unlinkSync(path.join(__dirname, `..${imagePath}`));
            })

        updatedUser.profileImage = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;
    }

    Users.findOneAndUpdate({_id: req.auth.userId}, updatedUser)
        .then(() => {res.status(200).json({message: "Compte utilisateur modifié"})})
        .catch(error => { res.status(400).json({error })});
}

exports.delete = (req, res, next) => {
    //vérifie si propriétaire du compte ou admin
    const promise = new Promise((resolve, reject) => {
        if(req.auth.userId === req.params.userId) {
            resolve();
        }

        Users.findOne({_id: req.auth.userId})
            .then((user) => {
                if(user.isAdmin) {
                    resolve();
                }
                reject("Vous n'êtes pas autorisé à faire cette action.");
            })
    })

    promise
        .then(async () => {
            //supprime les likes de l'utilisateur et décrémente le compteur de like
            let likes = await Likes.find({likerId: req.params.userId});
            for(let like of likes) {
                let post = await Posts.findOne({_id: like.postId});
                post.numberLike--;
                await post.save();
                await like.delete();
            }
            //supprime les commentaires de l'utilisateur et décrémente le compteur de commentaire
            let comments = await Comments.find({authorId: req.params.userId});
            for(let comment of comments) {
                let post = await Posts.findOne({_id: comment.postId});
                post.numberComment--;
                await post.save();
                await comment.delete();
            }
            //supprime les commentaires et likes liés aux posts créer par l'utilisateur
            let posts = await Posts.find({authorId: req.params.userId});
            for(let post of posts) {
                await Comments.deleteMany({postId: post._id});
                await Likes.deleteMany({postId: post._id});
            }
            //supprime les posts de l'utilisateur
            await Posts.deleteMany({authorId: req.params.userId});

            let user = await Users.findOne({_id: req.params.userId});
            // On crée un objet url depuis la string sauvegardée pour pouvoir accéder à .pathname
            const url = new URL(user.profileImage);
            const imagePath = url.pathname;
            // On supprime image, __dirname = répertoire courant
            fs.unlinkSync(path.join(__dirname, `..${imagePath}`));

            //supprime l'utilisateur
            await Users.deleteOne({_id: req.params.userId});
            res.status(200).json({ message: "Utilisateur supprimé" });
        })
        .catch(error => { res.status(400).json({ error }); })
}