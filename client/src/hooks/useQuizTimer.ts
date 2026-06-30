import { useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectIsQuizActive,
  selectIsQuizPaused,
  selectTimeRemaining,
  decrementTime,
  completeQuiz,
  nextQuestion,
  selectCurrentQuiz,
  selectCurrentQuestionIndex,
} from '@features/quiz'

export const useQuizTimer = () => {
  const dispatch = useDispatch()
  const isActive = useSelector(selectIsQuizActive)
  const isPaused = useSelector(selectIsQuizPaused)
  const timeRemaining = useSelector(selectTimeRemaining)
  const currentQuiz = useSelector(selectCurrentQuiz)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)

  useEffect(() => {
    if (!isActive || isPaused) return

    const timer = setInterval(() => {
      dispatch(decrementTime())
    }, 1000)

    return () => clearInterval(timer)
  }, [isActive, isPaused, dispatch])

  // Handle time expiration
  useEffect(() => {
    if (!isActive || timeRemaining > 0) return

    if (currentQuiz?.typeOfTime === 'time for any question') {
      // Auto-advance to next question or complete quiz
      if (currentQuestionIndex < currentQuiz.quizQuestions.length - 1) {
        dispatch(nextQuestion())
      } else {
        dispatch(completeQuiz())
      }
    } else {
      // Global time - complete quiz
      dispatch(completeQuiz())
    }
  }, [timeRemaining, isActive, currentQuiz, currentQuestionIndex, dispatch])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    timeRemaining,
    formattedTime: formatTime(timeRemaining),
    isTimeLow: timeRemaining < 30,
    isTimeCritical: timeRemaining < 10,
  }
}
