import mongoose, { Schema, Document, Model } from "mongoose";

const PlaceSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  coordinates: { type: [Number], required: true }, // [lat, lng]
  type: {
    type: String,
    enum: ["destination", "viewpoint", "restaurant", "hotel", "activity"],
    default: "destination",
  },
  duration: { type: String },
  tips: { type: String },
  imageQuery: { type: String },
  imageUrl: { type: String },
  rating: { type: Number, min: 0, max: 5 },
  address: { type: String },
});

const RouteSegmentSchema = new Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  distance: { type: String, required: true },
  duration: { type: String, required: true },
  mode: {
    type: String,
    enum: ["driving", "walking", "cycling"],
    default: "driving",
  },
  instructions: [{ type: String }],
});

const DaySchema = new Schema({
  day: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  places: [PlaceSchema],
  routes: [RouteSegmentSchema],
});

const ChatMessageSchema = new Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export interface ITrip extends Document {
  title: string;
  description: string;
  coverImage?: string;
  coverImageQuery?: string;
  owner: mongoose.Types.ObjectId;
  originalTrip?: mongoose.Types.ObjectId;
  destinations: string[];
  days: (typeof DaySchema)[];
  totalDays: number;
  totalDistance?: string;
  budget?: "budget" | "moderate" | "luxury";
  tags: string[];
  isPublic: boolean;
  saves: number;
  savedBy: mongoose.Types.ObjectId[];
  chatHistory: (typeof ChatMessageSchema)[];
  createdAt: Date;
  updatedAt: Date;
}

const TripSchema = new Schema<ITrip>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    coverImage: { type: String },
    coverImageQuery: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    originalTrip: { type: Schema.Types.ObjectId, ref: "Trip" },
    destinations: [{ type: String }],
    days: [DaySchema],
    totalDays: { type: Number, required: true, default: 1 },
    totalDistance: { type: String },
    budget: {
      type: String,
      enum: ["budget", "moderate", "luxury"],
      default: "moderate",
    },
    tags: [{ type: String }],
    isPublic: { type: Boolean, default: false },
    saves: { type: Number, default: 0 },
    savedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    chatHistory: [ChatMessageSchema],
  },
  { timestamps: true }
);

TripSchema.index({ isPublic: 1, createdAt: -1 });
TripSchema.index({ owner: 1, createdAt: -1 });
TripSchema.index({ tags: 1 });
TripSchema.index({ title: "text", description: "text", destinations: "text" });

const Trip: Model<ITrip> =
  mongoose.models.Trip || mongoose.model<ITrip>("Trip", TripSchema);

export default Trip;
