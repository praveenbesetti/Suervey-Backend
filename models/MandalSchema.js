import mongoose from 'mongoose';
const mandalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },

  username: { type: String, },
  password: { type: String, required: true }, // Always hash this with bcrypt
  phone: { type: String },     // Changed from 'Phone' to 'phone'
  agentname: { type: String }
});
mandalSchema.index({ name: 1, districtId: 1 }, { unique: true });
export const Mandal = mongoose.model('Mandal', mandalSchema);