import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question:     { type: String, required: true },
    options:      { type: [String], required: true },
    correctIndex: { type: Number, required: true, min: 0, max: 3 },
    explanation:  { type: String, required: true },
  },
  { _id: false },
);

const quizSchema = new mongoose.Schema(
  {
    courseId:  { type: String, required: true, unique: true, index: true },
    questions: { type: [questionSchema], default: [] },
  },
  { timestamps: true },
);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
