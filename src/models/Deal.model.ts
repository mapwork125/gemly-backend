import mongoose from 'mongoose';
const DealSchema = new mongoose.Schema({
  bid: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid' },
  requirement: { type: mongoose.Schema.Types.ObjectId, ref: 'Requirement' },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: Number,
  status: { type: String, default: 'created' },
  pdf: Buffer,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Deal', DealSchema);
