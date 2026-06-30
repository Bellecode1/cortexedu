import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ArrowLeft, Printer, Users, Trophy, FileQuestion, ShieldAlert, SearchX, AlertTriangle, RefreshCw } from 'lucide-react'
import { GlassCard } from '@components/ui/GlassCard'
import { Button } from '@components/ui/Button'
import { selectCurrentUser } from '@features/auth'
import { useGetPvByQuizQuery } from '@app/api'
import { formatDateTime, cn } from '@lib/utils'

const getDecisionColor = (percent: number) => {
  if (percent >= 80) return 'text-green-400'
  if (percent >= 60) return 'text-blue-400'
  if (percent >= 50) return 'text-amber-400'
  return 'text-red-400'
}

const getDecisionBg = (percent: number) => {
  if (percent >= 80) return 'bg-green-500/10 border-green-500/30'
  if (percent >= 60) return 'bg-blue-500/10 border-blue-500/30'
  if (percent >= 50) return 'bg-amber-500/10 border-amber-500/30'
  return 'bg-red-500/10 border-red-500/30'
}

export const PvPage = () => {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  const { data: pvData, isLoading: isLoadingPv, isError, error, refetch } = useGetPvByQuizQuery(
    { quizId: quizId || '', authorId: user?.id || '' },
    { skip: !quizId || !user?.id }
  )

  const handlePrint = () => {
    window.print()
  }

  // Extract error details
  const errorStatus = (error as any)?.status || 0
  const errorMessage = (error as any)?.data?.error || ''

  if (isLoadingPv) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/quiz')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Procès-Verbal</h1>
        </div>
        <GlassCard>
          <div className="animate-pulse space-y-4 p-8">
            <div className="h-8 bg-white/5 rounded w-1/3" />
            <div className="h-4 bg-white/5 rounded w-1/4" />
            <div className="h-64 bg-white/5 rounded-xl" />
          </div>
        </GlassCard>
      </div>
    )
  }

  // ── Error states ──
  if (isError) {
    const isForbidden = errorStatus === 403
    const isNotFound = errorStatus === 404 || errorMessage.includes('trouvé')

    if (isForbidden) {
      return (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/quiz')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Procès-Verbal</h1>
          </div>
          <GlassCard className="text-center py-12 border-red-500/30">
            <ShieldAlert className="h-14 w-14 mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Accès refusé</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Vous n'êtes pas autorisé à générer le Procès-Verbal pour ce quiz. Seul l'auteur du quiz ou un administrateur peut le faire.
            </p>
            <Button className="mt-6" variant="secondary" onClick={() => navigate('/quiz')}>
              Retour à la liste des quiz
            </Button>
          </GlassCard>
        </div>
      )
    }

    if (isNotFound) {
      return (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/quiz')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">Procès-Verbal</h1>
          </div>
          <GlassCard className="text-center py-12 border-amber-500/30">
            <SearchX className="h-14 w-14 mx-auto text-amber-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Quiz introuvable</h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Ce quiz n'existe pas ou a été supprimé.
            </p>
            <Button className="mt-6" variant="secondary" onClick={() => navigate('/quiz')}>
              Retour à la liste des quiz
            </Button>
          </GlassCard>
        </div>
      )
    }

    // Generic error
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/quiz')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Procès-Verbal</h1>
        </div>
        <GlassCard className="text-center py-12 border-red-500/30">
          <AlertTriangle className="h-14 w-14 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Erreur</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            Une erreur est survenue lors de la génération du Procès-Verbal.
          </p>
          {errorMessage && (
            <p className="text-sm text-red-400 mt-2 font-mono bg-red-500/10 px-3 py-1.5 rounded-lg inline-block">
              {errorMessage}
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="secondary" onClick={() => navigate('/quiz')}>
              Retour aux quiz
            </Button>
            <Button variant="primary" onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          </div>
        </GlassCard>
      </div>
    )
  }

  // ── Empty / no data ──
  if (!pvData) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/quiz')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Procès-Verbal</h1>
        </div>
        <GlassCard className="text-center py-12">
          <FileQuestion className="h-12 w-12 mx-auto text-slate-500/50 mb-4" />
          <p className="text-lg text-slate-400">
            Aucun résultat disponible pour ce quiz.
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Assurez-vous que des étudiants ont complété ce quiz.
          </p>
        </GlassCard>
      </div>
    )
  }

  const { quiz, students, stats } = pvData
  const totalMarks = quiz.totalMarks || 0

  return (
    <div className="max-w-5xl mx-auto space-y-6 print:space-y-4">
      {/* Actions - hidden when printing */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/quiz')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Procès-Verbal</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </div>

      {/* ═══════════ PV Document ═══════════ */}
      <div
        id="pv-document"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:rounded-none print:shadow-none print:border-0"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-navy-900 text-white px-8 py-6 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight print:text-slate-900">
                {pvData.institution}
              </h2>
              <p className="text-slate-400 text-sm mt-1 print:text-slate-500">
                Procès-Verbal des résultats d'évaluation
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400 print:text-slate-500">
                Session : {pvData.session}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 print:text-slate-400">
                Généré le {formatDateTime(pvData.generatedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Quiz Info */}
        <div className="px-8 py-4 border-b border-slate-200 print:border-slate-300">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Évaluation</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{quiz.name}</p>
            </div>
            {quiz.description && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</p>
                <p className="text-sm text-slate-700 mt-0.5">{quiz.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Période</p>
              <p className="text-sm text-slate-700 mt-0.5">
                {formatDateTime(quiz.startDate)} — {formatDateTime(quiz.endDate)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Barème</p>
              <p className="text-sm text-slate-700 mt-0.5">
                {quiz.totalQuestions} question{quiz.totalQuestions > 1 ? 's' : ''} • {totalMarks} point{totalMarks > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="px-8 py-5 border-b border-slate-200 print:border-slate-300">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Récapitulatif
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 print:bg-slate-50">
              <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
              <p className="text-xs text-slate-500">Étudiant{stats.totalStudents > 1 ? 's' : ''}</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 print:bg-slate-50">
              <p className="text-2xl font-bold text-slate-900">{stats.averagePercent}%</p>
              <p className="text-xs text-slate-500">Moyenne</p>
            </div>
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 print:bg-green-50">
              <p className="text-2xl font-bold text-green-700">{stats.admittedCount}</p>
              <p className="text-xs text-green-600">Admis ({stats.successRate}%)</p>
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 print:bg-red-50">
              <p className="text-2xl font-bold text-red-700">{stats.failedCount}</p>
              <p className="text-xs text-red-600">Ajourné{stats.failedCount > 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Score distribution */}
          {stats.distribution && stats.distribution.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500 mb-2">Distribution des scores</p>
              <div className="space-y-1.5">
                {stats.distribution.map((d: any, i: number) => {
                  const pct = stats.totalStudents > 0
                    ? Math.round((d.count / stats.totalStudents) * 100)
                    : 0
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-36 flex-shrink-0">{d.range}</span>
                      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-700 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-8 text-right">{d.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Students Table */}
        <div className="px-8 py-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Détail des résultats
          </h3>

          {students.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">Aucun étudiant n'a encore complété ce quiz.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-2 px-2 font-semibold text-slate-700">N°</th>
                    <th className="text-left py-2 px-2 font-semibold text-slate-700">Nom & Prénom</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700">Score</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700">%</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700">Niveau</th>
                    <th className="text-center py-2 px-2 font-semibold text-slate-700">Décision</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student: any, idx: number) => (
                    <tr
                      key={student.studentId}
                      className={cn(
                        'border-b border-slate-100',
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50',
                        student.decision === 'Admis'
                          ? 'print:bg-white'
                          : 'print:bg-red-50/50'
                      )}
                    >
                      <td className="py-2.5 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-medium text-slate-900">
                        {student.studentName}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono text-slate-700">
                        {student.score}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={cn(
                          'font-bold font-mono',
                          getDecisionColor(student.percent)
                        )}>
                          {student.percent}%
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium border',
                          getDecisionBg(student.percent)
                        )}>
                          {student.feedback}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={cn(
                          'px-3 py-1 rounded text-xs font-bold border',
                          student.decision === 'Admis'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-red-100 text-red-800 border-red-300'
                        )}>
                          {student.decision}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer - Jury signatures */}
        <div className="px-8 py-6 border-t border-slate-200 print:border-slate-300">
          <div className="flex items-start justify-between">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Le Président du jury</p>
                <div className="mt-6 w-48 border-b border-slate-300" />
                <p className="text-xs text-slate-400 mt-1">Nom & Signature</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Le Secrétaire du jury</p>
                <div className="mt-6 w-48 border-b border-slate-300" />
                <p className="text-xs text-slate-400 mt-1">Nom & Signature</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Fait à {pvData.institution}, le {formatDateTime(pvData.generatedAt)}</p>
              <p className="text-xs text-slate-400 mt-1">PV généré automatiquement via CortexEdu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #pv-document {
            margin: 0;
            page-break-after: avoid;
          }
          @page {
            margin: 1.5cm;
          }
        }
      `}</style>
    </div>
  )
}
