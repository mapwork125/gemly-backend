import mongoose from 'mongoose';
const MessageSchema = new mongoose.Schema({
  conversationId: String,
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  meta: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Message', MessageSchema);
