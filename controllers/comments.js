const Comments = require('../models/comments');
const Users = require('../models/users');
const Posts = require('../models/posts');

exports.create = (req, res, next) => {
    const comment = new Comments({
        authorId: req.auth.userId,
        postId: req.params.postId,
        // updated_datetime ayant une valeur par défaut on passe le body et createdDatetime
        createdDatetime: new Date(),
        ...req.body
    });


    comment.save()
        .then(() => {
            Posts.findOne({_id: req.params.postId})
                .then(post => {
                    post.numberComment++;
                    post.save()
                        .then(() => res.status(201).json({ message: 'Création de commentaire effectuée !'}))
                        .catch(error => res.status(400).json({ error }));
                })
                .catch(error => res.status(400).json({ error }));
        })
        //error dans json est écrit sous forme de raccourci c'est la même chose que 'error: error'
        .catch(error => res.status(400).json({ error }));
}

exports.getAll = (req, res, next) => {
    Comments.find({postId: req.params.postId}, {__v: 0}).sort({createdDateTime : -1}).lean()
        .then(async comments => {
            const promise = new Promise((resolve, reject) => {
                let index = 0;
                let maxIndex = comments.length;
                for(let comment of comments) {
                    Users.findOne({_id: comment.authorId}, {email: 0, password: 0, __v: 0})
                        .then(user => {
                            comment.user = user;
                            index++;
                            delete comment.authorId;
                            if (index === maxIndex) {
                                resolve();
                            }
                        })
                        .catch(error => res.status(400).json({ error }));
                }
            })
            promise
                .then(function(){res.status(200).json(comments);})
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => res.status(400).json({ error }));
}