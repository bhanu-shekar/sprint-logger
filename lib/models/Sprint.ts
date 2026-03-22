import mongoose from "mongoose";

const SprintSchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ["Active", "Completed", "Planned"],
    default: "Planned",
  },
  description: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Sprint ||
  mongoose.model("Sprint", SprintSchema);
