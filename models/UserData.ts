import mongoose from "mongoose"

const ProgressSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  itemType: {
    type: String,
    enum: ["podcast", "audiobook"],
    required: true,
  },
  position: {
    type: Number,
    default: 0,
  },
  chapter: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

const UserDataSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    favorites: {
      podcasts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Podcast" }],
      audiobooks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Audiobook" }],
    },
    progress: [ProgressSchema],
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.UserData || mongoose.model("UserData", UserDataSchema)
