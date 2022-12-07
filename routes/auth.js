//pour créer un routeur on a besoin d'express -> importation express
const express = require('express');
//création d'un routeur avec la méthode router()
//cela permet de faire router.post, router.get etc au lieu de app.post, app.get etc
const router = express.Router();
//import multer
const multer = require('../middlewares/multer-config');
const authCtrl = require('../controllers/auth');

router.post('/signup', multer, authCtrl.signup);
router.post('/login', authCtrl.login);
router.post('/logout', authCtrl.logout);

module.exports = router;