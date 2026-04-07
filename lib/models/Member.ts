import mongoose from "mongoose";

// ⚠️ IMPORTANT: Never use "type" as a field name inside a nested Mongoose schema
// object — Mongoose treats { type: X } as a SchemaType declaration, not a field.
// We use "kind" instead as the avatar variant discriminator.

const MemberSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  role:       String,
  department: {
    type:    String,
    enum:    ["Frontend", "Design", "Backend", "DevOps", "Data Science", "Scrum Master", "Other"],
    default: "Other",
  },
  avatar: {
    kind:   { type: String, enum: ["nice", "initials"], default: "nice" },
    config: { type: mongoose.Schema.Types.Mixed, default: {}  },
    seed:   { type: String, default: "default" },
  },
  gradientIndex: { type: Number, default: 0 },
  createdAt:     { type: Date, default: Date.now },
});

export default mongoose.models.Member || mongoose.model("Member", MemberSchema);