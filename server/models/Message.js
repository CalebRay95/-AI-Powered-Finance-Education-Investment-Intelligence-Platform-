import mongoose from 'mongoose';

const VALID_ROOMS = ['general', 'options-trading', 'crypto-analysis', 'dividend-investing'];

const messageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    room: {
      type: String,
      enum: VALID_ROOMS,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    // Threading: null = top-level message, ObjectId = reply to that message
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
  },
  { versionKey: false },
);

// Efficient history queries: fetch recent messages per room
messageSchema.index({ room: 1, timestamp: 1 });

const Message = mongoose.model('Message', messageSchema);
export default Message;
