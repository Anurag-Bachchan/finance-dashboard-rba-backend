const mongoose = require("mongoose");

const TYPES = ["income", "expense"];
const CATEGORIES = ["food", "household", "shopping", "transport"];

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      required: true,
      enum: TYPES,
    },
    category: {
      type: String,
      required: true,
      enum: CATEGORIES,
    },
    date: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
module.exports.TYPES = TYPES;
module.exports.CATEGORIES = CATEGORIES;
