// import de mongoose dans ce fichier car on en a besoin pour créer le schèma/model
const mongoose = require('mongoose');

//Schema est une fonction mise à disposition par mongoose
const likeSchema = mongoose.Schema({
  //required: true est une configuration qui indique que c'est un champs requis
  postId: { type: mongoose.Schema.Types.ObjectId, required: true},
  likerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: Number, required: true},
  createdDatetime: { type: Date, default: Date() }
});

//premier argument passé à model c'est le nom du model et le deuxième argument c'est le schéma
module.exports = mongoose.model('GroupomaniaLikes', likeSchema);
