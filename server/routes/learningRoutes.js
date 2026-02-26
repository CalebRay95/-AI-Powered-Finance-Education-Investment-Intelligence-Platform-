/**
 * learningRoutes.js
 *
 * GET  /api/learning/courses                 — course list + merged user progress
 * GET  /api/learning/courses/:courseId       — single course + quiz shell + progress
 * POST /api/learning/quiz/:courseId/submit   — grade answers, persist score
 * PATCH /api/learning/progress/:courseId     — mark a lesson as completed
 */

import express from 'express';
import Course from '../models/Course.js';
import Quiz from '../models/Quiz.js';
import User from '../models/User.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All learning routes require authentication
router.use(protect);

// ── Helper: find or initialise a user's progress entry for a course ───────────
function mergeProgress(learningProgress = [], courseId) {
  return (
    learningProgress.find((p) => p.courseId === courseId) || {
      courseId,
      completedLessons: [],
      quizScore: null,
      quizCompleted: false,
      lastAccessed: null,
    }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/courses
// Returns all courses with minimal lesson info + merged user progress.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/courses', async (req, res) => {
  // Fetch courses — return only lessonId + title for list view (no heavy content)
  const courses = await Course.find()
    .select('courseId title level description icon estimatedMinutes lessons.lessonId lessons.title')
    .lean();

  const user = await User.findById(req.user._id).select('learningProgress').lean();
  const progress = user?.learningProgress || [];

  const merged = courses.map((course) => {
    const prog = mergeProgress(progress, course.courseId);
    const totalLessons = course.lessons.length;
    const completedCount = prog.completedLessons.length;
    const progressPct =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      ...course,
      completedCount,
      progressPct,
      quizCompleted: prog.quizCompleted,
      quizScore: prog.quizScore,
      lastAccessed: prog.lastAccessed,
    };
  });

  res.json(merged);
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/learning/courses/:courseId
// Returns full lesson content, quiz (without answers), and progress.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/courses/:courseId', async (req, res) => {
  const { courseId } = req.params;

  const course = await Course.findOne({ courseId }).lean();
  if (!course) return res.status(404).json({ message: 'Course not found.' });

  // Send quiz questions and options — never send correctIndex or explanation
  const quizDoc = await Quiz.findOne({ courseId })
    .select('courseId questions.question questions.options')
    .lean();

  const user = await User.findById(req.user._id).select('learningProgress').lean();
  const progress = mergeProgress(user?.learningProgress || [], courseId);

  const totalLessons = course.lessons.length;
  const completedCount = progress.completedLessons.length;
  const progressPct =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  res.json({
    course,
    quiz: quizDoc || null,
    progress: {
      ...progress,
      completedCount,
      progressPct,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/learning/quiz/:courseId/submit
// Grades answers and persists the score to the user's learningProgress.
// Body: { answers: [Number] }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/quiz/:courseId/submit', async (req, res) => {
  const { courseId } = req.params;
  const { answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ message: '`answers` must be an array of selected option indices.' });
  }

  const quizDoc = await Quiz.findOne({ courseId });
  if (!quizDoc) return res.status(404).json({ message: 'Quiz not found.' });

  const questions = quizDoc.questions;
  const total = questions.length;
  let correct = 0;

  const results = questions.map((q, i) => {
    const isCorrect = answers[i] === q.correctIndex;
    if (isCorrect) correct++;
    return { correct: isCorrect, explanation: q.explanation };
  });

  const score = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Check if a progress entry already exists for this course
  const user = await User.findById(req.user._id).select('learningProgress');
  const existingEntry = user.learningProgress.find((p) => p.courseId === courseId);

  if (existingEntry) {
    // Update existing entry via arrayFilters
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'learningProgress.$[elem].quizScore': score,
          'learningProgress.$[elem].quizCompleted': true,
          'learningProgress.$[elem].lastAccessed': new Date(),
        },
      },
      { arrayFilters: [{ 'elem.courseId': courseId }] },
    );
  } else {
    // No entry yet — push a new progress object with quiz data
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        learningProgress: {
          courseId,
          completedLessons: [],
          quizScore: score,
          quizCompleted: true,
          lastAccessed: new Date(),
        },
      },
    });
  }

  res.json({ score, correct, total, results });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/learning/progress/:courseId
// Marks a lesson as completed.
// Body: { lessonId: String }
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/progress/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const { lessonId } = req.body;

  if (!lessonId) {
    return res.status(400).json({ message: '`lessonId` is required.' });
  }

  const user = await User.findById(req.user._id).select('learningProgress');
  const existingEntry = user.learningProgress.find((p) => p.courseId === courseId);

  if (existingEntry) {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { 'learningProgress.$[elem].completedLessons': lessonId },
        $set: { 'learningProgress.$[elem].lastAccessed': new Date() },
      },
      { arrayFilters: [{ 'elem.courseId': courseId }] },
    );
  } else {
    // Create entry with this lesson already completed
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        learningProgress: {
          courseId,
          completedLessons: [lessonId],
          quizScore: null,
          quizCompleted: false,
          lastAccessed: new Date(),
        },
      },
    });
  }

  const updated = await User.findById(req.user._id).select('learningProgress').lean();
  const updatedEntry = mergeProgress(updated.learningProgress, courseId);
  res.json(updatedEntry);
});

export default router;
