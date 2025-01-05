const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productCommentSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
  },
  profileImagePath: {
    type: String,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductComment",
    default: null,
  }, // Référence au commentaire paren
  formattedDate: {
    type: String,
  },
  replies : {
    type : Number,
    default : 0
  },
  isDeleted: { type: Boolean, default: false }, // Nouveau champ pour indiquer si le commentaire est supprimé
  deletedAt: { type: Date }, // Pour enregistrer la date de suppression, optionnel
});

module.exports = mongoose.model("ProductComment3", productCommentSchema);
