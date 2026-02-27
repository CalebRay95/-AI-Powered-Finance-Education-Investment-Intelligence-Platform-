import mongoose from 'mongoose';

/**
 * connectDB — establishes a Mongoose connection to MongoDB.
 * Retries indefinitely every 5 s instead of calling process.exit,
 * so nodemon never kills a running server just because Mongo is
 * temporarily unavailable (preventing EADDRINUSE on restart).
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gift';
  while (true) {
    try {
      await mongoose.connect(uri);
      console.log(`MongoDB connected: ${mongoose.connection.host}`);
      return; // success — exit the loop
    } catch (error) {
      console.error(`MongoDB connection error: ${error.message}`);
      console.error('Retrying in 5 s…');
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
};

export default connectDB;
