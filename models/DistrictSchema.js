import mongoose from 'mongoose';
const districtSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  state: { type: String, default: "Andhra Pradesh" }
});

export const District = mongoose.model('District', districtSchema);