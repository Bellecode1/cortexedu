import { useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { ArrowLeft, ArrowRight, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card'
import { selectCurrentUser } from '@features/auth'
import { useGetQuizByIdQuery, useCreateResultMutation } from '@app/api'
import {
  startQuiz,
  setAnswer,
  nextQuestion,
  previousQuestion,
  completeQuiz,
  resetQuizSession,
  jumpToQuestion,
  selectCurrentQuiz,
  selectCurrentQuestion,
  selectCurrentQuestionIndex,
  selectAnswers,
  selectQuizProgress,
  selectIsQuizActive,
} from '@features/quiz'
import { useQuizTimer } from '@hooks/useQuizTimer'
import type { Quiz } from '@/types'
import type { Answer } from '@features/quiz/quizSessionSlice'

// ─── Fonction partagée de calcul & sauvegarde du résultat ───
async function saveQuizResult(
  params: {
    quiz: Quiz
    answers: Answer[]
    userId: string
    markAsComplete: () => void
    createResult: any
    showToast: boolean
  }
) {
  const { quiz, answers, userId, markAsComplete, createResult, showToast } = params

  // Calcul du score
  let totalScore = 0
  let maxScore = 0
  quiz.quizQuestions.forEach((question, index) => {
    maxScore += question.marks
    if (answers[index]?.selectedAnswer === question.correctAnswer) {
      totalScore += question.marks
    }
  })
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
  let feedback = 'Non acquis'
  if (percentage >= 80) feedback = 'Acquis'
  else if (percentage >= 60) feedback = "En cours d'acquisition"
  else if (percentage >= 40) feedback = 'Partiellement acquis'

  // Marquer comme complété dans Redux
  markAsComplete()

  // Sauvegarder sur le serveur
  const quizQuestionsWithAnswers = quiz.quizQuestions.map((q) => ({
    ...q,
    userAnswer: answers.find((a) => a.questionId === q.id)?.selectedAnswer ?? null,
  }))

  await createResult({
    studentId: userId,
    quizId: quiz.id,
    score: `${totalScore}/${maxScore}`,
    percent: percentage,
    feedback,
    ...quiz,
    quizQuestions: quizQuestionsWithAnswers,
    status: 'complete',
  } as any).unwrap()

  if (showToast) {
    toast.success(`Quiz soumis ! Score: ${percentage}%`)
  }

  return { totalScore, maxScore, percentage, feedback }
}

export const QuizTakePage = () => {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const currentQuiz = useSelector(selectCurrentQuiz)
  const currentQuestion = useSelector(selectCurrentQuestion)
  const currentIndex = useSelector(selectCurrentQuestionIndex)
  const answers = useSelector(selectAnswers)
  const progress = useSelector(selectQuizProgress)
  const isActive = useSelector(selectIsQuizActive)
  const user = useSelector(selectCurrentUser)

  const { data: quiz, isLoading } = useGetQuizByIdQuery(quizId || '', {
    skip: !quizId,
  })
  const [createResult, { isLoading: isSaving }] = useCreateResultMutation()

  const { formattedTime, isTimeLow, isTimeCritical } = useQuizTimer()

  const isSubmitting = useRef(false)

  // Start quiz when data is loaded
  useEffect(() => {
    if (quiz && !currentQuiz) {
      dispatch(startQuiz(quiz))
    }
  }, [quiz, currentQuiz, dispatch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentQuiz) {
        dispatch(resetQuizSession())
      }
    }
  }, [currentQuiz, dispatch])

  // ─── Auto-save when timer expires ───
  const isAutoSaving = useRef(false)
  useEffect(() => {
    if (!currentQuiz || !user) return
    if (isActive) return // quiz still running
    if (answers.length === 0) return // quiz never started
    if (isSubmitting.current || isAutoSaving.current) return // already saving

    isAutoSaving.current = true
    saveQuizResult({
      quiz: currentQuiz,
      answers,
      userId: user.id,
      markAsComplete: () => {}, // already completed by timer
      createResult,
      showToast: false,
    })
      .then(() => {
        toast.info('Temps écoulé ! Résultat enregistré.')
      })
      .catch((err: any) => {
        console.error('Erreur auto-sauvegarde:', err)
        toast.error('Erreur lors de la sauvegarde auto')
      })
      .finally(() => {
        isAutoSaving.current = false
        navigate('/results')
      })
  }, [isActive]) // eslint-disable-line react-hooks/exhaustive-deps
  // Seulement isActive pour éviter de relancer à chaque changement de réponse

  const handleAnswerSelect = (answerIndex: number) => {
    if (currentQuestion) {
      dispatch(
        setAnswer({
          questionId: currentQuestion.id,
          answerIndex,
        })
      )
    }
  }

  const handleNext = useCallback(() => {
    if (currentIndex < (currentQuiz?.quizQuestions.length || 0) - 1) {
      dispatch(nextQuestion())
    }
  }, [currentIndex, currentQuiz, dispatch])

  const handlePrevious = useCallback(() => {
    dispatch(previousQuestion())
  }, [dispatch])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting.current || !currentQuiz || !user) return
    isSubmitting.current = true

    const answeredCount = answers.filter((a) => a.selectedAnswer !== null).length
    if (answeredCount < progress.total) {
      const confirmed = confirm(
        `Vous n'avez répondu qu'à ${answeredCount} questions sur ${progress.total}. Êtes-vous sûr de vouloir soumettre ?`
      )
      if (!confirmed) {
        isSubmitting.current = false
        return
      }
    }

    try {
      await saveQuizResult({
        quiz: currentQuiz,
        answers,
        userId: user.id,
        markAsComplete: () => dispatch(completeQuiz()),
        createResult,
        showToast: true,
      })
      navigate('/results')
    } catch (err) {
      console.error('Erreur sauvegarde résultat:', err)
      toast.error('Erreur lors de la sauvegarde du résultat')
      navigate('/results')
    } finally {
      isSubmitting.current = false
    }
  }, [currentQuiz, user, answers, progress, dispatch, createResult, navigate])

  if (isLoading) {
    return <div className="text-center py-8">Chargement du quiz...</div>
  }

  if (!currentQuiz || !currentQuestion) {
    return <div className="text-center py-8">Quiz non trouvé</div>
  }

  const currentAnswer = answers.find((a) => a.questionId === currentQuestion.id)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{currentQuiz.name}</h1>
          <p className="text-muted-foreground">
            Question {progress.current} sur {progress.total}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${
            isTimeCritical
              ? 'bg-destructive text-destructive-foreground'
              : isTimeLow
                ? 'bg-orange-100 text-orange-800'
                : 'bg-muted'
          }`}
        >
          <Clock className="h-5 w-5" />
          {formattedTime}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${(progress.current / progress.total) * 100}%` }}
        />
      </div>

      {/* Warning for unanswered questions */}
      {progress.answered < progress.current && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>Vous n'avez pas encore répondu à cette question</span>
        </div>
      )}

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg leading-relaxed">
            {currentQuestion.mainQuestion}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentQuestion.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  currentAnswer?.selectedAnswer === index
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      currentAnswer?.selectedAnswer === index
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    }`}
                  >
                    {currentAnswer?.selectedAnswer === index && (
                      <div className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </div>
                  <span>{choice}</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Précédent
        </Button>

        <div className="flex gap-2">
          {currentIndex < progress.total - 1 ? (
            <Button onClick={handleNext}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} variant="default" disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sauvegarde...</>
              ) : (
                'Soumettre'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Navigateur de questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {answers.map((answer, index) => (
              <button
                key={answer.questionId}
                onClick={() => dispatch(jumpToQuestion(index))}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  index === currentIndex
                    ? 'bg-primary text-primary-foreground'
                    : answer.selectedAnswer !== null
                      ? 'bg-green-100 text-green-800'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
