import mongoose, { Schema } from "mongoose";

const toJSONTransform = {
  virtuals: true,
  versionKey: false,
  transform(_doc: any, ret: any) {
    ret.id = ret._id.toString();
    delete ret._id;
  },
};

// --- User ---

const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, default: null, sparse: true },
    firstName: { type: String, default: null },
    lastName: { type: String, default: null },
    profileImageUrl: { type: String, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);
userSchema.set("toJSON", toJSONTransform);
export const UserModel = mongoose.model("User", userSchema);

// --- Child ---

const childSchema = new Schema({
  parentId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  level: { type: String, default: "beginner" },
  learningScore: { type: Number, default: 0 },
  screenTimeLimit: { type: Number, default: 60 },
  avatarColor: { type: String, default: "blue" },
});
childSchema.set("toJSON", toJSONTransform);
export const ChildModel = mongoose.model("Child", childSchema);

// --- Module ---

const moduleSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  difficultyLevel: { type: Number, default: 1 },
  contentUrl: { type: String, default: null },
});
moduleSchema.set("toJSON", toJSONTransform);
export const ModuleModel = mongoose.model("Module", moduleSchema);

// --- Progress ---

const progressSchema = new Schema({
  childId: { type: Schema.Types.ObjectId, ref: "Child", required: true, index: true },
  moduleId: { type: Schema.Types.ObjectId, ref: "Module", required: true },
  completed: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now },
});
progressSchema.set("toJSON", toJSONTransform);
export const ProgressModel = mongoose.model("Progress", progressSchema);

// --- DailyChallenge ---

const dailyChallengeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  points: { type: Number, default: 10 },
});
dailyChallengeSchema.set("toJSON", toJSONTransform);
export const DailyChallengeModel = mongoose.model("DailyChallenge", dailyChallengeSchema);

// --- ChildChallenge ---

const childChallengeSchema = new Schema({
  childId: { type: Schema.Types.ObjectId, ref: "Child", required: true },
  challengeId: { type: Schema.Types.ObjectId, ref: "DailyChallenge", required: true },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
});
childChallengeSchema.set("toJSON", toJSONTransform);
export const ChildChallengeModel = mongoose.model("ChildChallenge", childChallengeSchema);
