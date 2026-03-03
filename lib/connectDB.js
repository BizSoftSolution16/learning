import mongoose from "mongoose";

export default connectDB = () => {
    mongoose.connect('mongodb://localhost:27017/')
}
