const express = require('express');
const router = express.Router();

const auth = require('../middlewares/auth');

const commentsCtrl = require('../controllers/comments');

router.post('/post/:postId', auth, commentsCtrl.create);
router.get('/post/:postId', auth, commentsCtrl.getAll);

module.exports = router;