import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    lessonId: { type: String, required: true },
    title:    { type: String, required: true },
    content:  { type: String, required: true }, // markdown / prose
  },
  { _id: false },
);

const courseSchema = new mongoose.Schema(
  {
    courseId:         { type: String, required: true, unique: true, index: true },
    title:            { type: String, required: true },
    level:            { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], required: true },
    description:      { type: String, required: true },
    icon:             { type: String, default: '📘' },
    estimatedMinutes: { type: Number, default: 30 },
    lessons:          { type: [lessonSchema], default: [] },
  },
  { timestamps: true },
);

const Course = mongoose.model('Course', courseSchema);
export default Course;
