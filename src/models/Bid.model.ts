import mongoose from 'mongoose';
const BidSchema = new mongoose.Schema({
  requirement: { type: mongoose.Schema.Types.ObjectId, ref: 'Requirement' },
  bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: Number,
  terms: String,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Bid', BidSchema);
