import mongoose from 'mongoose';
const RatingSchema = new mongoose.Schema({
  target: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: Number,
  review: String,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Rating', RatingSchema);
