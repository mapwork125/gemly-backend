import mongoose from 'mongoose';
const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  body: String,
  type: { type: String, enum: ['business','general'], default: 'business' },
  read: { type: Boolean, default: false },
  meta: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Notification', NotificationSchema);
