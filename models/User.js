const mongoose = require("mongoose");

const ROLES = ["admin", "user", "analyst"];
const STATUSES = ["active", "inactive"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      default: "user",
    },
    status: {
      type: String,
      enum: STATUSES,
      default: "active",
    },
    transactions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Transaction",
        },
      ],
      default: [],
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

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
module.exports.STATUSES = STATUSES;
