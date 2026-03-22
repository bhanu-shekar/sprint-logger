import mongoose from "mongoose";
import "./Member"; // Ensure Member model is registered for population

const TaskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
  },
  sprintId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sprint",
  },
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ["Feature", "Bug", "Design", "DevOps", "Other"],
  },
  assigneeIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
  ],
  timeValue: { type: Number, default: 0 },
  timeUnit: { type: String, enum: ["h", "d"], default: "h" },
  status: {
    type: String,
    enum: ["To Do", "In Progress", "Review", "Done"],
    default: "To Do",
  },
  order: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Task ||
  mongoose.model("Task", TaskSchema);
