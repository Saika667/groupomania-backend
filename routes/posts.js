//pour créer un routeur on a besoin d'express -> importation express
const express = require('express');
//création d'un routeur avec la méthode router()
//cela permet de faire router.post, router.get etc au lieu de app.post, app.get etc
const router = express.Router();
//import de la middleware
const auth = require('../middlewares/auth');
//import multer
const multer = require('../middlewares/multer-config');
const postsCtrl = require('../controllers/posts');

router.post('/', auth, multer, postsCtrl.create);
router.get('/', auth, postsCtrl.getAll);
router.post('/:postId/like', auth, postsCtrl.likeUnLike);
router.delete('/:postId', auth, postsCtrl.delete);
router.put('/:postId/modify', auth, multer, postsCtrl.modify);

module.exports = router;