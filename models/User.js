import mongoose from "mongoose";
const UserSchema = mongoose.Schema({
    name: { type: string, required: true },
    email: { type: string, required: true },
    password: { type: string, required: true },
    role: { type: string, required: true, default: 'user' },
})

export default mongoose.model('User', UserSchema);