// import de mongoose dans ce fichier car on en a besoin pour créer le schèma/model
const mongoose = require('mongoose');

//Schema est une fonction mise à disposition par mongoose
const commentSchema = mongoose.Schema({
  //required: true est une configuration qui indique que c'est un champs requis
  postId: { type: mongoose.Schema.Types.ObjectId, required: true},
  authorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  content: { type: String, required: true},
  createdDatetime: { type: Date, required: true },
  updatedDatetime: { type: Date, default: null}
});

//premier argument passé à model c'est le nom du model et le deuxième argument c'est le schéma
module.exports = mongoose.model('GroupomaniaComments', commentSchema);
