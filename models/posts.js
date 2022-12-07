// import de mongoose dans ce fichier car on en a besoin pour créer le schèma/model
const mongoose = require('mongoose');

//Schema est une fonction mise à disposition par mongoose
const postSchema = mongoose.Schema({
  //required: true est une configuration qui indique que c'est un champs requis
  authorId: { type: mongoose.Schema.Types.ObjectId, required: true},
  content: { type: String, required: true},
  imageUrl: { type: String },
  numberLike: { type: Number, default: 0},
  numberComment: { type: Number, default: 0},
  createdDatetime: { type: Date, required: true },
  updatedDatetime: { type: Date, default: null}
});

//premier argument passé à model c'est le nom du model et le deuxième argument c'est le schéma
module.exports = mongoose.model('GroupomaniaPosts', postSchema);
