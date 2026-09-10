const mongoose = require("mongoose");
const moment = require("moment-timezone");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
    enabled: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
    versionKey: false,
    toJSON: {
      getters: true,
      virtuals: true,
      transform(_, record) {
        record.id = record._id;
        record.createdAt = moment(record.createdAt).format();
        record.updatedAt = moment(record.updatedAt).format();
        delete record._id;
      },
    }
  });

module.exports = mongoose.model("User", userSchema);
