const mongoose = require("mongoose");
const moment = require("moment-timezone");

const fileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    filename: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
      index: true
    },
    publicId: {
      type: String,
      required: true,
      unique: true
    },
    url: {
      type: String,
      required: true
    },

    resourceType: {
      type: String,
      enum: ["image", "video", "audio", "raw"],
      required: true
    },

    mimeType: {
      type: String,
      required: true
    },

    extension: {
      type: String,
      required: true
    },

    size: {
      type: Number,
      required: true,
      min: 0
    },

    tags: {
      type: [String],
      default: [],
      index: true
    },

    viewCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true
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

fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ tags: 1, createdAt: -1 });
fileSchema.index({ filename: 1, createdAt: -1 });

module.exports = mongoose.model("File", fileSchema);
