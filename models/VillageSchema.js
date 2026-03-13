import mongoose from 'mongoose';
const villageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mandalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mandal', required: true, index: true },
  subagents: [{
    username: { type: String, required: true },
    password: { type: String, required: true },
    token:{ type: String },
    isAuthorized:{type:Boolean, default:true},
    name: { type: String, required: true },
    phone: { type: String },
    count: { type: Number, default: 0 } 
  }]
});

// Compound index for super-fast searches

villageSchema.index({ name: 1, mandalId: 1 }, { unique: true });
export const Village = mongoose.model('Village', villageSchema);