import mongoose from "mongoose"

const ChapterSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: Number,
    default: 0,
  },
  startPosition: {
    type: Number,
    default: 0,
  },
  audioUrl: String,
})

const AudiobookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    narrator: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: String,
    duration: {
      type: Number,
      default: 0,
    },
    category: String,
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    chapters: [ChapterSchema],
    externalId: String, // For mapping to external API IDs
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Audiobook || mongoose.model("Audiobook", AudiobookSchema)
