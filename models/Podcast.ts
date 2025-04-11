import mongoose from "mongoose"

const EpisodeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  audioUrl: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    default: 0,
  },
  releaseDate: {
    type: Date,
    default: Date.now,
  },
  imageUrl: String,
})

const PodcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: String,
    category: String,
    episodes: [EpisodeSchema],
    externalId: String, // For mapping to external API IDs
  },
  {
    timestamps: true,
  },
)

export default mongoose.models.Podcast || mongoose.model("Podcast", PodcastSchema)
