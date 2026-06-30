import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, Play, Edit, Trash2, FileQuestion, Users, ScrollText } from 'lucide-react'
import { GlassCard } from '@components/ui/GlassCard'
import { Button } from '@components/ui/Button'
import { selectIsTeacher, selectIsAdmin, selectCurrentUser } from '@features/auth'
import {
  useGetQuizsByAuthorQuery,
  useGetQuizsByStudentQuery,
  useGetAllQuizsQuery,
  useDeleteQuizMutation,
} from '@app/api'
import { formatDateTime } from '@lib/utils'
import { toast } from 'sonner'

const getStatusBadge = (startDate: string, endDate: string) => {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) {
    return <span className="px-2 py-0.5 text-xs rounded-lg bg-white/5 text-slate-400 border border-white/10">À venir</span>
  } else if (now > end) {
    return <span className="px-2 py-0.5 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">Terminé</span>
  } else {
    return <span className="px-2 py-0.5 text-xs rounded-lg bg-green-500/10 text-green-400 border border-green-500/30">En cours</span>
  }
}

export const QuizListPage = () => {
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const isTeacher = useSelector(selectIsTeacher)
  const isAdmin = useSelector(selectIsAdmin)
  const canCreate = isTeacher || isAdmin
  const isParent = user?.role === 'Parent'
  const isStudent = user?.role === 'Student'

  const [deleteQuiz] = useDeleteQuizMutation()

  // Fetch ALL quizzes for Admin
  const { data: allQuizzes, isLoading: isLoadingAll } = useGetAllQuizsQuery(undefined, {
    skip: !isAdmin,
  })

  // Fetch quizzes for Student (via dedicated endpoint that handles branch fallback)
  const { data: studentQuizzes, isLoading: isLoadingBranch } = useGetQuizsByStudentQuery(
    user?.id || '',
    { skip: !isStudent || !user?.id }
  )

  // Fetch teacher's own quizzes
  const { data: teacherQuizzes, isLoading: isLoadingTeacher } = useGetQuizsByAuthorQuery(
    user?.id || '',
    { skip: !isTeacher || !user?.id }
  )

  const handleDelete = async (quizId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      try {
        await deleteQuiz(quizId).unwrap()
        toast.success('Quiz supprimé avec succès')
      } catch {
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const quizzes = isAdmin
    ? allQuizzes
    : isTeacher
    ? teacherQuizzes
    : studentQuizzes

  const isLoading = isLoadingBranch || isLoadingTeacher || isLoadingAll

  // Parent guard
  if (isParent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz</h1>
          <p className="text-slate-500">Quiz disponibles</p>
        </div>
        <GlassCard className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-slate-500/50 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Espace Quiz</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Les parents ne passent pas de quiz. Veuillez consulter l'onglet "Résultats" pour suivre la progression de vos enfants.
          </p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz</h1>
          <p className="text-slate-500">
            {isTeacher ? 'Gérez vos quiz' : 'Quiz disponibles pour votre branche'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/quiz/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Créer un quiz
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-500">Chargement...</div>
      ) : quizzes && quizzes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <GlassCard key={quiz.id} hoverEffect className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">{quiz.name}</h3>
                  {quiz.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 mt-0.5">
                      {quiz.description}
                    </p>
                  )}
                </div>
                {getStatusBadge(quiz.startDate, quiz.endDate)}
              </div>

              <div className="space-y-1.5 text-sm text-slate-500 mb-4">
                <p>Début: {formatDateTime(quiz.startDate)}</p>
                <p>Fin: {formatDateTime(quiz.endDate)}</p>
                <p>Questions: {quiz.quizQuestions?.length || 0}</p>
                <p>Type: {quiz.typeOfTime === 'global Time' ? 'Temps global' : 'Temps/question'}</p>
              </div>

              <div className="flex gap-2 mt-auto">
                {!isTeacher && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/quiz/take/${quiz.id}`)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Commencer
                  </Button>
                )}
                {isTeacher && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/quiz/edit/${quiz.id}`)}
                      title="Modifier"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/quiz/pv/${quiz.id}`)}
                      title="Procès-Verbal"
                    >
                      <ScrollText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(quiz.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard className="text-center py-12">
          <FileQuestion className="h-12 w-12 mx-auto text-slate-500/50 mb-4" />
          <p className="text-lg font-medium text-slate-300">
            {isTeacher
              ? "Vous n'avez pas encore créé de quiz."
              : "Aucun quiz disponible pour votre branche."}
          </p>
          {canCreate && (
            <Button className="mt-4" onClick={() => navigate('/quiz/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Créer un quiz
            </Button>
          )}
        </GlassCard>
      )}
    </div>
  )
}
