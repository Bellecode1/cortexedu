import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Quiz } from '@/types'

export interface Answer {
  questionId: string
  selectedAnswer: number | null
  timeSpent: number
  isCorrect?: boolean
}

interface QuizSessionState {
  currentQuiz: Quiz | null
  currentQuestionIndex: number
  answers: Answer[]
  timeRemaining: number
  isActive: boolean
  isPaused: boolean
  startTime: string | null
  endTime: string | null
  score: number
}

const initialState: QuizSessionState = {
  currentQuiz: null,
  currentQuestionIndex: 0,
  answers: [],
  timeRemaining: 0,
  isActive: false,
  isPaused: false,
  startTime: null,
  endTime: null,
  score: 0,
}

const quizSessionSlice = createSlice({
  name: 'quizSession',
  initialState,
  reducers: {
    startQuiz: (state, action: PayloadAction<Quiz>) => {
      const quiz = action.payload
      state.currentQuiz = quiz
      state.currentQuestionIndex = 0
      state.answers = quiz.quizQuestions.map((q) => ({
        questionId: q.id,
        selectedAnswer: null,
        timeSpent: 0,
      }))
      state.timeRemaining =
        quiz.typeOfTime === 'global Time'
          ? quiz.quizQuestions.reduce((acc, q) => acc + q.time, 0)
          : quiz.quizQuestions[0]?.time || 0
      state.isActive = true
      state.isPaused = false
      state.startTime = new Date().toISOString()
      state.endTime = null
      state.score = 0
    },
    setAnswer: (
      state,
      action: PayloadAction<{ questionId: string; answerIndex: number }>
    ) => {
      const { questionId, answerIndex } = action.payload
      const answer = state.answers.find((a) => a.questionId === questionId)
      if (answer) {
        answer.selectedAnswer = answerIndex
      }
    },
    nextQuestion: (state) => {
      if (state.currentQuiz && state.currentQuestionIndex < state.currentQuiz.quizQuestions.length - 1) {
        state.currentQuestionIndex += 1
        if (state.currentQuiz.typeOfTime === 'time for any question') {
          state.timeRemaining =
            state.currentQuiz.quizQuestions[state.currentQuestionIndex]?.time || 0
        }
      }
    },
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1
        if (state.currentQuiz?.typeOfTime === 'time for any question') {
          state.timeRemaining =
            state.currentQuiz.quizQuestions[state.currentQuestionIndex]?.time || 0
        }
      }
    },
    updateTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload
    },
    decrementTime: (state) => {
      if (state.timeRemaining > 0) {
        state.timeRemaining -= 1
      }
    },
    updateQuestionTimeSpent: (
      state,
      action: PayloadAction<{ questionId: string; timeSpent: number }>
    ) => {
      const { questionId, timeSpent } = action.payload
      const answer = state.answers.find((a) => a.questionId === questionId)
      if (answer) {
        answer.timeSpent = timeSpent
      }
    },
    pauseQuiz: (state) => {
      state.isPaused = true
    },
    resumeQuiz: (state) => {
      state.isPaused = false
    },
    completeQuiz: (state) => {
      state.isActive = false
      state.endTime = new Date().toISOString()

      // Calculate score
      if (state.currentQuiz) {
        let totalScore = 0
        state.answers.forEach((answer, index) => {
          const question = state.currentQuiz?.quizQuestions[index]
          if (question && answer.selectedAnswer === question.correctAnswer) {
            totalScore += question.marks
            answer.isCorrect = true
          } else {
            answer.isCorrect = false
          }
        })
        state.score = totalScore
      }
    },
    resetQuizSession: () => initialState,
    jumpToQuestion: (state, action: PayloadAction<number>) => {
      if (
        state.currentQuiz &&
        action.payload >= 0 &&
        action.payload < state.currentQuiz.quizQuestions.length
      ) {
        state.currentQuestionIndex = action.payload
        if (state.currentQuiz.typeOfTime === 'time for any question') {
          state.timeRemaining =
            state.currentQuiz.quizQuestions[action.payload]?.time || 0
        }
      }
    },
  },
})

export const {
  startQuiz,
  setAnswer,
  nextQuestion,
  previousQuestion,
  updateTimeRemaining,
  decrementTime,
  updateQuestionTimeSpent,
  pauseQuiz,
  resumeQuiz,
  completeQuiz,
  resetQuizSession,
  jumpToQuestion,
} = quizSessionSlice.actions

export default quizSessionSlice.reducer

// Selectors
export const selectCurrentQuiz = (state: { quizSession: QuizSessionState }) =>
  state.quizSession.currentQuiz
export const selectCurrentQuestion = (state: { quizSession: QuizSessionState }) => {
  const { currentQuiz, currentQuestionIndex } = state.quizSession
  return currentQuiz?.quizQuestions[currentQuestionIndex] || null
}
export const selectCurrentQuestionIndex = (state: { quizSession: QuizSessionState }) =>
  state.quizSession.currentQuestionIndex
export const selectAnswers = (state: { quizSession: QuizSessionState }) =>
  state.quizSession.answers
export const selectTimeRemaining = (state: { quizSession: QuizSessionState }) =>
  state.quizSession.timeRemaining
export const selectIsQuizActive = (state: { quizSession: QuizSessionState }) =>
  state.quizSession.isActive
export const selectIsQuizPaused = (state: { quizSession: QuizSessionState }) =>
  state.quizSession.isPaused
export const selectQuizScore = (state: { quizSession: QuizSessionState }) =>
  state.quizSession.score
export const selectQuizProgress = (state: { quizSession: QuizSessionState }) => {
  const { currentQuiz, currentQuestionIndex, answers } = state.quizSession
  if (!currentQuiz) return { total: 0, current: 0, answered: 0 }
  return {
    total: currentQuiz.quizQuestions.length,
    current: currentQuestionIndex + 1,
    answered: answers.filter((a) => a.selectedAnswer !== null).length,
  }
}
