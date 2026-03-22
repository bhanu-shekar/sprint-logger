import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#3525cd" },
  status: {
    type: String,
    enum: ["Active", "On Hold", "Completed"],
    default: "Active",
  },
  description: String,
  sprintId: { type: mongoose.Schema.Types.ObjectId, ref: "Sprint" },
  order: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Project ||
  mongoose.model("Project", ProjectSchema);
