import mongoose from 'mongoose';
const InventorySchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sku: String,
  details: mongoose.Schema.Types.Mixed,
  status: { type: String, enum: ['on_memo','in_locker','sold'], default: 'in_locker' },
  barcode: String,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Inventory', InventorySchema);
