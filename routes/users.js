const express = require('express');

const router = express.Router();
const usersCtrl = require('../controllers/users');
const auth = require('../middlewares/auth');
const multer = require('../middlewares/multer-config');

router.get('', auth, usersCtrl.getAll);
router.get('/:userId', auth, usersCtrl.getOne);
router.delete('/:userId', auth, usersCtrl.delete);
router.put('/modify', auth, multer, usersCtrl.modify);

module.exports = router;