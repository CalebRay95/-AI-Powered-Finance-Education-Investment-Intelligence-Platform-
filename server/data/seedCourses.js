/**
 * seedCourses.js
 *
 * One-time seed script. Run from the project root:
 *   node server/data/seedCourses.js
 *
 * Each courses.json entry contains both the course metadata/lessons and
 * a `quiz` array. The script upserts Course and Quiz documents separately.
 */

import connectDB from '../config/db.js';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';
import courseData from './courses.json' assert { type: 'json' };

async function seed() {
  await connectDB();
  console.log('Connected to MongoDB. Seeding courses...\n');

  for (const entry of courseData) {
    const { quiz, ...courseFields } = entry;

    // ── Upsert Course ─────────────────────────────────────────────────────────
    const course = await Course.findOneAndUpdate(
      { courseId: courseFields.courseId },
      { $set: courseFields },
      { upsert: true, new: true },
    );
    console.log(`✅  Course upserted: ${course.title} (${course.courseId})`);

    // ── Upsert Quiz ───────────────────────────────────────────────────────────
    const quizDoc = await Quiz.findOneAndUpdate(
      { courseId: courseFields.courseId },
      { $set: { courseId: courseFields.courseId, questions: quiz } },
      { upsert: true, new: true },
    );
    console.log(`   Quiz  upserted: ${quizDoc.questions.length} questions\n`);
  }

  console.log('Seeding complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
