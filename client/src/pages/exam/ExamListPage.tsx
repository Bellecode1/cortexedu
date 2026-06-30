import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Clock, Upload, Trash2, Users, Download, CheckCircle, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@components/ui/Button'
import { GlassCard } from '@components/ui/GlassCard'
import { selectCurrentUser, selectIsTeacher, selectIsAdmin } from '@features/auth'
import {
  useGetExamsQuery,
  useGetExamsByTeacherQuery,
  useGetExamsByBranchQuery,
  useGetSubmissionsByStudentQuery,
  useDeleteExamMutation,
} from '@app/api'
import { formatDate, formatDateTime } from '@lib/utils'

export const ExamListPage = () => {
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const isTeacher = useSelector(selectIsTeacher)
  const isAdmin = useSelector(selectIsAdmin)
  const canCreate = isTeacher || isAdmin
  const isParent = user?.role === 'Parent'

  const [deleteExam] = useDeleteExamMutation()

  // Student submissions (to know if already submitted)
  const { data: studentSubmissions } = useGetSubmissionsByStudentQuery(user?.id || '', {
    skip: !user?.id || isTeacher || isAdmin || isParent,
  })

  // Map exam_id -> submission for quick lookup
  const submittedExamIds = useMemo(() => {
    if (!studentSubmissions) return new Set<string>()
    return new Set(studentSubmissions.map(s => s.exam_id))
  }, [studentSubmissions])

  // Teacher sees their own exams + branch exams; student sees branch exams
  const { data: teacherExams } = useGetExamsByTeacherQuery(user?.id || '', {
    skip: !isTeacher || !user?.id,
  })
  const { data: teacherBranchExams } = useGetExamsByBranchQuery(user?.brancnId || '', {
    skip: !isTeacher || !user?.brancnId,
  })
  const { data: branchExams } = useGetExamsByBranchQuery(user?.brancnId || '', {
    skip: !user?.brancnId || isTeacher || isAdmin || isParent,
  })
  const { data: allExams } = useGetExamsQuery(undefined, {
    skip: !isAdmin || isParent,
  })

  // Merge teacher exams: own exams + branch exams (deduplicated)
  const mergedTeacherExams = isTeacher && teacherExams && teacherBranchExams
    ? [...new Map([...teacherBranchExams, ...teacherExams].map(e => [e.id, e])).values()]
    : isTeacher
    ? teacherExams || teacherBranchExams
    : undefined

  const exams = isAdmin ? allExams : isTeacher ? mergedTeacherExams : isParent ? [] : branchExams

  const handleDelete = async (examId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette épreuve ?')) {
      try {
        await deleteExam(examId).unwrap()
        toast.success('Épreuve supprimée')
      } catch {
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const getStatusBadge = (dueDate: string | null | undefined) => {
    if (!dueDate) return <span className="px-2 py-0.5 text-xs rounded-lg bg-white/5 text-slate-400 border border-white/10">Pas de limite</span>
    const now = new Date()
    const due = new Date(dueDate)
    if (due < now) return <span className="px-2 py-0.5 text-xs rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">Terminé</span>
    return <span className="px-2 py-0.5 text-xs rounded-lg bg-green-500/10 text-green-400 border border-green-500/30">En cours</span>
  }

  // Parent guard
  if (isParent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Épreuves</h1>
          <p className="text-muted-foreground">Consultez et soumettez vos copies</p>
        </div>
        <GlassCard className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-slate-500/50 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Espace Épreuves</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Les parents ne passent pas d'épreuves. Veuillez consulter l'onglet "Résultats" pour suivre la progression de vos enfants.
          </p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Épreuves</h1>
          <p className="text-slate-500">
            {isTeacher ? 'Gérez vos épreuves et copies' : 'Consultez et soumettez vos copies'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/examinations/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Publier une épreuve
          </Button>
        )}
      </div>

      {!exams || exams.length === 0 ? (
        <GlassCard className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-slate-500/50 mb-4" />
          <p className="text-lg font-medium text-slate-300">
            {isTeacher ? 'Aucune épreuve publiée' : 'Aucune épreuve disponible'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {isTeacher ? 'Créez votre première épreuve' : 'Revenez plus tard'}
          </p>
          {canCreate && (
            <Button className="mt-4" onClick={() => navigate('/examinations/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Publier une épreuve
            </Button>
          )}
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => (
            <GlassCard key={exam.id} hoverEffect className="flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate">{exam.title}</h3>
                  {exam.teacher_name && (
                    <p className="text-sm text-slate-500 truncate mt-0.5">
                      Par {exam.teacher_name}
                    </p>
                  )}
                </div>
                {getStatusBadge(exam.due_date)}
              </div>

              {exam.description && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                  {exam.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {exam.created_at ? formatDate(exam.created_at) : '-'}
                </span>
                {exam.due_date && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(exam.due_date)}
                  </span>
                )}
              </div>

              <div className="flex gap-2 flex-wrap mt-auto">
                {exam.file_path && (
                  <a
                    href={`http://localhost:3000${exam.file_path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-neon-cyan hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    Fichier
                  </a>
                )}
                {isTeacher ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/examinations/submissions/${exam.id}`)}
                    >
                      <Users className="mr-1 h-3 w-3" />
                      Copies
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exam.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </>
                ) : submittedExamIds.has(exam.id) ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/examinations/submit/${exam.id}`)}
                  >
                    <CheckCircle className="mr-1 h-3 w-3 text-green-400" />
                    <span className="text-green-400">Déjà soumis</span>
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/examinations/submit/${exam.id}`)}
                  >
                    <Upload className="mr-1 h-3 w-3" />
                    Soumettre
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Student's submitted copies */}
      {!isTeacher && !isAdmin && !isParent && studentSubmissions && studentSubmissions.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="flex items-center gap-2 text-white font-semibold tracking-tight">
                <GraduationCap className="h-5 w-5 text-neon-cyan" />
                Mes copies soumises
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {studentSubmissions.length} copie(s) soumise(s) • {studentSubmissions.filter(s => s.grade !== null && s.grade !== undefined).length} notée(s)
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {studentSubmissions.map((sub) => {
              const exam = exams?.find(e => e.id === sub.exam_id)
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/examinations/submit/${sub.exam_id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <div className="h-8 w-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-neon-cyan" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-200 truncate">
                        {exam?.title || sub.exam_title || 'Épreuve'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Soumise le {formatDateTime(sub.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {sub.grade !== null && sub.grade !== undefined ? (
                      <>
                        <span className="text-base font-bold text-green-400">{sub.grade}/20</span>
                        <span className="px-2 py-0.5 text-xs rounded-lg bg-green-500/10 text-green-400 border border-green-500/30">
                          {Math.round((sub.grade / 20) * 100)}%
                        </span>
                      </>
                    ) : (
                      <span className="px-2 py-0.5 text-xs rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        En attente
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}
    </div>
  )
}
