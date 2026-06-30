import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FileQuestion,
  Trophy,
  Clock,
  TrendingUp,
  ArrowRight,
  CalendarClock,
  Play,
  BarChart3,
  Star,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  UserCheck,
  Activity,
  PlusCircle,
  ListChecks,
  GitBranch,
  ClipboardCheck,
  BellRing,
  ScrollText,
} from 'lucide-react'
import { GlassCard } from '@components/ui/GlassCard'
import { Button } from '@components/ui/Button'
import { selectCurrentUser, selectIsStudent, selectIsTeacher, selectIsParent, selectIsAdmin } from '@features/auth'
import {
  useGetResultsByUserQuery,
  useGetQuizsByBranchQuery,
  useGetResultsByParentQuery,
  useGetTeacherStatsQuery,
  useGetQuizsByAuthorQuery,
  useGetSubmissionsByTeacherQuery,
  useGetSubmissionsByParentQuery,
} from '@app/api'
import { ScoreDistributionChart, SubjectComparisonChart } from '@components/charts/ProgressChart'
import { formatDate, formatDateTime, formatDuration, cn } from '@lib/utils'
import type { StudentQuizResult } from '@/types'

// Helper to parse "6/10" → { correct: 6, total: 10 }
const parseScore = (score: string) => {
  const parts = score.split('/')
  return {
    correct: parseInt(parts[0]) || 0,
    total: parseInt(parts[1]) || 1,
  }
}

// Helper to get feedback color
const getFeedbackColor = (percent: number) => {
  if (percent >= 80) return 'bg-green-500'
  if (percent >= 60) return 'bg-blue-500'
  if (percent >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getFeedbackText = (percent: number) => {
  if (percent >= 80) return 'Acquis'
  if (percent >= 60) return "En cours d'acquisition"
  if (percent >= 40) return 'Partiellement acquis'
  return 'Non acquis'
}

// Sort results by date (most recent first)
const sortByDate = (a: StudentQuizResult, b: StudentQuizResult) =>
  new Date(b.createAt).getTime() - new Date(a.createAt).getTime()

export const DashboardPage = () => {
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const isStudent = useSelector(selectIsStudent)
  const isTeacher = useSelector(selectIsTeacher)
  const isParent = useSelector(selectIsParent)
  const isAdmin = useSelector(selectIsAdmin)

  // Student results
  const { data: results, isLoading: isLoadingResults } = useGetResultsByUserQuery(user?.id || '', {
    skip: !isStudent || !user?.id,
  })

  // Upcoming quizzes for the student's branch
  const { data: branchQuizzes, isLoading: isLoadingQuizzes } = useGetQuizsByBranchQuery(
    user?.brancnId || '',
    { skip: !isStudent || !user?.brancnId }
  )

  // ----- REAL CALCULATED STATS -----
  const stats = useMemo(() => {
    if (!results || results.length === 0) {
      return {
        completedCount: 0,
        averagePercent: 0,
        bestPercent: 0,
        totalTimeSpent: 0,
        trend: 0,
      }
    }

    const sorted = [...results].sort(sortByDate)
    const completedCount = results.filter(r => r.status === 'complete').length
    const averagePercent = Math.round(
      results.reduce((acc, r) => acc + (r.percent || 0), 0) / results.length
    )
    const bestPercent = Math.max(...results.map(r => r.percent || 0))

    // Estimate time from quiz questions (sum of all questions' time)
    const totalTimeSpent = results.reduce((acc, r) => {
      return acc + (r.quizQuestions?.reduce((qAcc, q) => qAcc + (q.time || 0), 0) || 0)
    }, 0)

    // Trend: compare average of last 3 with previous results
    let trend = 0
    if (sorted.length >= 4) {
      const recentAvg = sorted.slice(0, 3).reduce((acc, r) => acc + (r.percent || 0), 0) / 3
      const olderAvg = sorted.slice(3).reduce((acc, r) => acc + (r.percent || 0), 0) / (sorted.length - 3)
      trend = Math.round(recentAvg - olderAvg)
    }

    return { completedCount, averagePercent, bestPercent, totalTimeSpent, trend }
  }, [results])

  // ----- UPCOMING QUIZZES -----
  const upcomingQuizzes = useMemo(() => {
    if (!branchQuizzes) return []
    const now = new Date()
    return branchQuizzes
      .filter(q => new Date(q.endDate) > now)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, 4)
  }, [branchQuizzes])

  // ----- LAST 6 RESULTS FOR CHART -----
  const chartResults = useMemo(() => {
    if (!results) return []
    return [...results].sort(sortByDate).slice(0, 6).reverse()
  }, [results])

  // ----- LAST RESULT DETAILED -----
  const lastResult = useMemo(() => {
    if (!results || results.length === 0) return null
    return [...results].sort(sortByDate)[0]
  }, [results])

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Bonjour, {user?.name} {user?.surname}
          </h1>
          <p className="text-muted-foreground">
            Voici un aperçu de votre activité sur CortexEdu.
          </p>
        </div>
        {isStudent && (
          <Button onClick={() => navigate('/quiz')}>
            <Play className="mr-2 h-4 w-4" />
            Voir les quiz
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      {isStudent && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <GlassCard delay={0} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400">Quiz complétés</p>
                <FileQuestion className="h-4 w-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.completedCount}</div>
              {isLoadingResults && (
                <p className="text-xs text-slate-500">Chargement...</p>
              )}
            </GlassCard>

            <GlassCard delay={0.1} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400">Score moyen</p>
                <Trophy className="h-4 w-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.averagePercent}%</div>
              {stats.trend !== 0 && (
                <p className={cn(
                  'text-xs mt-1 flex items-center gap-1',
                  stats.trend > 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  <TrendingUp className={cn(
                    'h-3 w-3',
                    stats.trend < 0 && 'rotate-180'
                  )} />
                  {stats.trend > 0 ? '+' : ''}{stats.trend}% vs avant
                </p>
              )}
            </GlassCard>

            <GlassCard delay={0.2} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400">Meilleur score</p>
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold text-white">{stats.bestPercent}%</div>
            </GlassCard>

            <GlassCard delay={0.3} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400">Temps total</p>
                <Clock className="h-4 w-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold text-white">{formatDuration(stats.totalTimeSpent)}</div>
            </GlassCard>
          </div>

          {/* Middle Row: Evolution Chart + Upcoming Quizzes */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Score Evolution Chart */}
            <GlassCard delay={0.1}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="flex items-center gap-2 text-white font-semibold tracking-tight">
                    <BarChart3 className="h-5 w-5 text-neon-cyan" />
                    Évolution des scores
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">Vos 6 derniers quiz</p>
                </div>
                {results && results.length > 6 && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/results')}>
                    Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
              {chartResults.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Pas encore de résultats</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chartResults.map((result) => {
                    const percent = result.percent || 0
                    const { correct, total } = parseScore(result.score)
                    return (
                      <div key={result.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-200 truncate max-w-[180px]">
                            {result.name}
                          </span>
                          <span className="text-slate-500 text-xs">
                            {correct}/{total} • {percent}%
                          </span>
                        </div>
                        <div className="w-full bg-navy-700/50 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              getFeedbackColor(percent)
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </GlassCard>

            {/* Upcoming / Available Quizzes */}
            <GlassCard delay={0.2}>
              <div className="mb-4">
                <h3 className="flex items-center gap-2 text-white font-semibold tracking-tight">
                  <CalendarClock className="h-5 w-5 text-neon-violet" />
                  Quiz à venir
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">Quiz disponibles pour votre branche</p>
              </div>
              {isLoadingQuizzes ? (
                <div className="text-center py-8 text-slate-500">Chargement...</div>
              ) : upcomingQuizzes.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Aucun quiz à venir</p>
                  <p className="text-xs mt-1">Revenez plus tard ou vérifiez votre branche</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingQuizzes.map((quiz) => {
                    const now = new Date()
                    const startDate = new Date(quiz.startDate)
                    const isActive = now >= startDate
                    return (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 cursor-pointer"
                        onClick={() => navigate(`/quiz/take/${quiz.id}`)}
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="font-medium text-slate-200 truncate">{quiz.name}</p>
                          <p className="text-xs text-slate-500">
                            {isActive ? (
                              <span className="text-green-400">Disponible maintenant</span>
                            ) : (
                              <>Débute le {formatDateTime(quiz.startDate)}</>
                            )}
                            <span className="mx-1">•</span>
                            {quiz.quizQuestions?.length || 0} questions
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          {isActive ? (
                            <Button size="sm" variant="primary">
                              <Play className="h-3 w-3 mr-1" />
                              Commencer
                            </Button>
                          ) : (
                            <span className="px-3 py-1 text-xs rounded-full bg-white/5 text-slate-400 border border-white/10">
                              À venir
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {branchQuizzes && branchQuizzes.length > upcomingQuizzes.length && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate('/quiz')}
                    >
                      Voir tous les quiz <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Bottom Row: Recent Activity + Last Quiz Detail */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <GlassCard delay={0.3}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold tracking-tight">Activité récente</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Vos derniers quiz complétés</p>
                </div>
                {results && results.length > 5 && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/results')}>
                    Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                )}
              </div>
              {isLoadingResults ? (
                <div className="text-center py-8 text-slate-500">Chargement...</div>
              ) : results && results.length > 0 ? (
                <div className="space-y-2">
                  {[...results].sort(sortByDate).slice(0, 5).map((result) => {
                    const pct = result.percent || 0
                    return (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 cursor-pointer"
                        onClick={() => navigate('/results')}
                      >
                        <div className="min-w-0 flex-1 mr-3">
                          <p className="font-medium text-slate-200 truncate">{result.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatDate(result.createAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="font-bold text-lg text-white">{pct}%</span>
                          <span className={cn(
                            'px-2 py-0.5 rounded-lg text-xs font-medium',
                            pct >= 80 ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                            pct >= 60 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                            pct >= 40 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/10 text-red-400 border border-red-500/30'
                          )}>
                            {getFeedbackText(pct)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileQuestion className="h-8 w-8 mx-auto mb-2 text-slate-500 opacity-50" />
                  <p className="text-slate-500">Aucune activité récente</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Rendez-vous dans la section Quiz pour commencer!
                  </p>
                  <Button className="mt-4" size="sm" onClick={() => navigate('/quiz')}>
                    Voir les quiz
                  </Button>
                </div>
              )}
            </GlassCard>

            {/* Last Quiz Detailed */}
            <GlassCard delay={0.4}>
              <div className="mb-4">
                <h3 className="text-white font-semibold tracking-tight">Dernier quiz</h3>
                <p className="text-sm text-slate-500 mt-0.5">Votre résultat le plus récent</p>
              </div>
              {lastResult ? (
                <div className="space-y-4">
                  <div className="text-center p-6 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-5xl font-bold text-neon-cyan mb-2">{lastResult.percent}%</div>
                    <p className="text-lg font-medium text-white">{lastResult.name}</p>
                    <p className="text-sm text-slate-500">{formatDate(lastResult.createAt)}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                      <p className="text-xl font-bold text-green-400">
                        {parseScore(lastResult.score).correct}
                      </p>
                      <p className="text-xs text-green-400/70">Correctes</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                      <p className="text-xl font-bold text-red-400">
                        {parseScore(lastResult.score).total - parseScore(lastResult.score).correct}
                      </p>
                      <p className="text-xs text-red-400/70">Fausses</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                      <p className="text-xl font-bold text-blue-400">
                        {lastResult.quizQuestions?.length || 0}
                      </p>
                      <p className="text-xs text-blue-400/70">Questions</p>
                    </div>
                  </div>

                  <div className={cn(
                    'text-center p-3 rounded-xl border text-sm font-medium',
                    (lastResult.percent || 0) >= 80 ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                    (lastResult.percent || 0) >= 60 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    (lastResult.percent || 0) >= 40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/10 text-red-400 border-red-500/30'
                  )}>
                    {lastResult.feedback}
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => navigate('/results')}
                  >
                    Voir tous mes résultats <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Pas encore de quiz complété</p>
                  <p className="text-xs mt-1">Votre premier résultat apparaîtra ici</p>
                </div>
              )}
            </GlassCard>
          </div>
        </>
      )}

      {isTeacher && <TeacherDashboardView user={user} navigate={navigate} />}

      {isParent && <ParentDashboardView user={user} navigate={navigate} />}

      {isAdmin && <AdminDashboardView navigate={navigate} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// TEACHER DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════

const TeacherDashboardView = ({ user, navigate }: { user: any; navigate: any }) => {
  const { data: stats, isLoading: isLoadingStats } = useGetTeacherStatsQuery(user?.id || '', {
    skip: !user?.id,
  })
  const { data: quizzes } = useGetQuizsByAuthorQuery(user?.id || '', {
    skip: !user?.id,
  })
  const { data: teacherSubmissions } = useGetSubmissionsByTeacherQuery(user?.id || '', {
    skip: !user?.id,
  })

  const recentQuizzes = useMemo(() => {
    if (!quizzes) return []
    return [...quizzes]
      .sort((a: any, b: any) => new Date(b.createAt || b.created_at).getTime() - new Date(a.createAt || a.created_at).getTime())
      .slice(0, 5)
  }, [quizzes])

  const totalQuestions = useMemo(() => {
    if (!quizzes) return 0
    return quizzes.reduce((sum: number, q: any) => sum + (q.quizQuestions?.length || 0), 0)
  }, [quizzes])

  return (
    <div className="space-y-6">
      {isLoadingStats ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard delay={0} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Quiz créés</p>
              <FileQuestion className="h-4 w-4 text-neon-violet" />
            </div>
            <div className="text-3xl font-bold text-white">{stats?.totalQuizzes || 0}</div>
            <p className="text-xs text-slate-500 mt-1">
              {totalQuestions} question(s) au total
            </p>
          </GlassCard>

          <GlassCard delay={0.1} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Soumissions</p>
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-white">{stats?.totalSubmissions || 0}</div>
            <p className="text-xs text-slate-500 mt-1">copies reçues</p>
          </GlassCard>

          <GlassCard delay={0.2} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Étudiants actifs</p>
              <UserCheck className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-white">{stats?.totalStudents || 0}</div>
            <p className="text-xs text-slate-500 mt-1">ont participé</p>
          </GlassCard>

          <GlassCard delay={0.3} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Moyenne générale</p>
              <GraduationCap className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-white">
              {stats?.averageScore || 0}%
            </div>
            <div className="w-full bg-navy-700/50 rounded-full h-1.5 mt-2">
              <div
                className={cn(
                  'h-full rounded-full',
                  (stats?.averageScore || 0) >= 80 ? 'bg-green-500' :
                  (stats?.averageScore || 0) >= 50 ? 'bg-blue-500' :
                  'bg-red-500'
                )}
                style={{ width: `${stats?.averageScore || 0}%` }}
              />
            </div>
          </GlassCard>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard delay={0.1}>
          <h3 className="text-white font-semibold tracking-tight mb-1">Actions rapides</h3>
          <p className="text-sm text-slate-500 mb-4">Accédez aux fonctionnalités principales</p>
          <div className="grid gap-2">
            <Button
              variant="secondary"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate('/quiz/create')}
            >
              <PlusCircle className="mr-3 h-5 w-5 text-neon-cyan" />
              <div className="text-left">
                <p className="font-medium">Créer un nouveau quiz</p>
                <p className="text-xs text-slate-500">Concevez un quiz avec questions et correction auto</p>
              </div>
            </Button>
            <Button
              variant="secondary"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate('/examinations/create')}
            >
              <FileText className="mr-3 h-5 w-5 text-blue-500" />
              <div className="text-left">
                <p className="font-medium">Publier une épreuve</p>
                <p className="text-xs text-slate-500">Déposez un sujet PDF et gérez les copies</p>
              </div>
            </Button>
            <Button
              variant="secondary"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate('/quiz')}
            >
              <ListChecks className="mr-3 h-5 w-5 text-green-500" />
              <div className="text-left">
                <p className="font-medium">Voir mes quiz</p>
                <p className="text-xs text-slate-500">Liste, modification et résultats</p>
              </div>
            </Button>
            <Button
              variant="secondary"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate('/quiz')}
            >
              <ScrollText className="mr-3 h-5 w-5 text-neon-violet" />
              <div className="text-left">
                <p className="font-medium">Générer un Procès-Verbal</p>
                <p className="text-xs text-slate-500">Créez un PV officiel des résultats par quiz</p>
              </div>
            </Button>
            <Button
              variant="secondary"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate('/results')}
            >
              <Activity className="mr-3 h-5 w-5 text-amber-500" />
              <div className="text-left">
                <p className="font-medium">Résultats des étudiants</p>
                <p className="text-xs text-slate-500">Analysez les performances par quiz</p>
              </div>
            </Button>
          </div>
        </GlassCard>

        <GlassCard delay={0.2}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold tracking-tight">Quiz récents</h3>
              <p className="text-sm text-slate-500 mt-0.5">Vos 5 derniers quiz créés</p>
            </div>
            {quizzes && quizzes.length > 5 && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/quiz')}>
                Voir tout <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
          {!quizzes || quizzes.length === 0 ? (
            <div className="text-center py-6 text-slate-500">
              <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucun quiz créé</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => navigate('/quiz/create')}
              >
                Créer mon premier quiz
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentQuizzes.map((quiz: any) => {
                const qCount = quiz.quizQuestions?.length || 0
                return (
                  <div
                    key={quiz.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/quiz/edit/${quiz.id}`)}
                  >
                    <div className="min-w-0 flex-1 mr-3">
                      <p className="font-medium text-sm text-slate-200 truncate">{quiz.name}</p>
                      <p className="text-xs text-slate-500">
                        {qCount} question{qCount > 1 ? 's' : ''}
                        <span className="mx-1">•</span>
                        {quiz.typeOfTime === 'global Time' ? 'Temps global' : 'Temps/question'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/quiz/pv/${quiz.id}`) }}
                        className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 border border-white/10 hover:border-neon-cyan/30 transition-all duration-200"
                        title="Générer le Procès-Verbal"
                      >
                        <ScrollText className="h-3.5 w-3.5" />
                      </button>
                      <span className="px-2 py-0.5 text-xs rounded-lg bg-white/5 text-slate-400 border border-white/10">
                        {qCount} Q
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Submissions */}
      <GlassCard delay={0.3}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="flex items-center gap-2 text-white font-semibold tracking-tight">
              <FileText className="h-5 w-5 text-neon-cyan" />
              Soumissions récentes
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {teacherSubmissions?.filter(s => s.grade === null || s.grade === undefined).length || 0} copie(s) en attente de notation
            </p>
          </div>
          {teacherSubmissions && teacherSubmissions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate('/examinations')}>
              Voir tout <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
        {!teacherSubmissions || teacherSubmissions.length === 0 ? (
          <div className="text-center py-6 text-slate-500">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucune copie soumise pour le moment</p>
            <p className="text-xs mt-1 text-slate-600">Les soumissions des étudiants apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teacherSubmissions
              .filter((s: any) => s.grade === null || s.grade === undefined)
              .slice(0, 5)
              .map((sub: any) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate(`/examinations/submissions/${sub.exam_id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400 text-xs font-bold">!</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-slate-200 truncate">
                        {sub.student_name || 'Inconnu'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {sub.exam_title} • {formatDateTime(sub.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-xs rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium flex-shrink-0">
                    Non notée
                  </span>
                </div>
              ))}
            {teacherSubmissions.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => navigate('/examinations')}
              >
                Voir toutes les soumissions <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </GlassCard>

      {stats && stats.totalSubmissions > 0 && stats.scoreDistribution && stats.scoreDistribution.length > 0 && (
        <ScoreDistributionChart data={stats.scoreDistribution} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// PARENT DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════

const ParentDashboardView = ({ user, navigate }: { user: any; navigate: any }) => {
  const { data: parentResults, isLoading } = useGetResultsByParentQuery(user?.id || '', {
    skip: !user?.id,
  })
  const { data: parentSubmissions } = useGetSubmissionsByParentQuery(user?.id || '', {
    skip: !user?.id,
  })

  const childrenData = useMemo(() => {
    if (!parentResults) return []
    return parentResults as any[]
  }, [parentResults])

  // Grouper les soumissions (épreuves notées) par enfant
  const examGradesByChild = useMemo(() => {
    if (!parentSubmissions) return {}
    const grouped: any = {}
    for (const sub of parentSubmissions as any[]) {
      const sid = sub.student_id
      if (!grouped[sid]) grouped[sid] = []
      grouped[sid].push(sub)
    }
    return grouped
  }, [parentSubmissions])

  return (
    <div className="space-y-6">
      <GlassCard delay={0}>
        <h2 className="flex items-center gap-2 text-white font-semibold tracking-tight">
          <Users className="h-5 w-5 text-neon-cyan" />
          Suivi de mes enfants
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Consultez les résultats et la progression de vos enfants
        </p>
      </GlassCard>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Chargement...</div>
      ) : childrenData.length === 0 && (!parentSubmissions || parentSubmissions.length === 0) ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-slate-500/50 mb-4" />
            <p className="text-lg font-medium text-slate-400">Aucun enfant associé</p>
            <p className="text-sm text-slate-500 mt-1">
              Contactez l'administration pour lier vos enfants à votre compte
            </p>
          </div>
        </GlassCard>
      ) : (
        childrenData.length > 0 ? childrenData.map((child: any, idx: number) => {
          const quizResults = child.quizResults || []
          const childSubmissions = (examGradesByChild as any)[child.student?.id] || []
          const chartData = [...quizResults]
            .sort((a: any, b: any) => new Date(a.createAt).getTime() - new Date(b.createAt).getTime())
            .map((r: any) => ({
              name: r.name?.substring(0, 15) || 'Quiz',
              score: r.percent || 0,
              date: r.createAt,
            }))

          const avgScore = chartData.length > 0
            ? Math.round(chartData.reduce((s: number, d: any) => s + d.score, 0) / chartData.length)
            : 0

          // Préparer les données pour le graphique comparatif par matière
          const quizSubjectData = quizResults
            .filter((r: any) => r.name && r.percent !== undefined)
            .map((r: any) => ({
              subject: r.name,
              score: r.percent,
              type: 'quiz' as const,
            }))
          const examSubjectData = childSubmissions.map((s: any) => ({
            subject: s.exam_title || 'Épreuve',
            score: Math.round(((s.grade || 0) / 20) * 100),
            type: 'exam' as const,
          }))

          return (
            <GlassCard key={idx} delay={0.1 * (idx + 1)}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="flex items-center gap-2 text-white font-semibold tracking-tight">
                    <BookOpen className="h-5 w-5 text-neon-cyan" />
                    {child.student?.name} {child.student?.surname}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {quizResults.length} quiz complété(s) • {childSubmissions.length} épreuve(s) notée(s) • Moyenne {avgScore}%
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/results')}
                >
                  Voir tout <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-4">
                {/* Graphique comparatif par matière */}
                {(quizSubjectData.length > 0 || examSubjectData.length > 0) && (
                  <SubjectComparisonChart
                    quizData={quizSubjectData}
                    examData={examSubjectData}
                    title="Comparatif par matière"
                    height={Math.max(220, (quizSubjectData.length + examSubjectData.length) * 40)}
                  />
                )}

                {/* Quiz results list */}
                {quizResults.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl divide-y divide-white/5">
                    <div className="px-4 py-2 text-xs font-medium text-slate-500 flex items-center gap-2">
                      <Trophy className="h-3 w-3" />
                      Quiz récents
                    </div>
                    {[...quizResults]
                      .sort((a: any, b: any) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime())
                      .slice(0, 5)
                      .map((result: any) => (
                        <div key={result.id} className="flex items-center justify-between px-4 py-2.5">
                          <div className="min-w-0 flex-1 mr-3">
                            <p className="font-medium text-sm text-slate-200 truncate">{result.name}</p>
                            <p className="text-xs text-slate-500">
                              {formatDate(result.createAt)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={cn(
                              'px-2 py-0.5 rounded-lg text-xs font-medium border',
                              (result.percent || 0) >= 80 ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                              (result.percent || 0) >= 60 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                              (result.percent || 0) >= 40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                              'bg-red-500/10 text-red-400 border-red-500/30'
                            )}>
                              {result.percent}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                {/* Exam submission grades by subject */}
                {childSubmissions.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/5 rounded-xl divide-y divide-white/5">
                    <div className="px-4 py-2 text-xs font-medium text-slate-500 flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Notes d'épreuves par matière
                    </div>
                    {childSubmissions.map((sub: any) => {
                      const isLate = sub.is_late
                      const hasDueDate = sub.exam_due_date
                      return (
                        <div key={sub.id} className="flex items-center justify-between px-4 py-2.5">
                          <div className="min-w-0 flex-1 mr-3">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-slate-200 truncate">
                                {sub.exam_title || 'Épreuve'}
                              </p>
                              {/* Statut En retard / À temps */}
                              {hasDueDate && (
                                isLate ? (
                                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-500/15 text-red-400 border border-red-500/30 flex-shrink-0">
                                    En retard
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-md bg-green-500/10 text-green-400 border border-green-500/20 flex-shrink-0">
                                    À temps
                                  </span>
                                )
                              )}
                            </div>
                            <p className="text-xs text-slate-500">
                              Notée le {formatDate(sub.graded_at)}
                              {hasDueDate && (
                                <> • Limite: {formatDate(sub.exam_due_date)}</>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn(
                              'text-base font-bold',
                              (sub.grade || 0) >= 14 ? 'text-green-400' :
                              (sub.grade || 0) >= 10 ? 'text-blue-400' :
                              (sub.grade || 0) >= 8 ? 'text-amber-400' :
                              'text-red-400'
                            )}>
                              {sub.grade}/20
                            </span>
                            <span className={cn(
                              'px-2 py-0.5 rounded-lg text-xs font-medium border',
                              (sub.grade || 0) >= 14 ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                              (sub.grade || 0) >= 10 ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                              (sub.grade || 0) >= 8 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                              'bg-red-500/10 text-red-400 border-red-500/30'
                            )}>
                              {Math.round(((sub.grade || 0) / 20) * 100)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </GlassCard>
          )
        }) : (
          /* Si pas de données de parents (studentArrayId vide) mais que des soumissions existent (cas improbable mais sécurisé) */
          <GlassCard>
            <div className="flex flex-col items-center justify-center py-8">
              <Users className="h-12 w-12 text-slate-500/50 mb-4" />
              <p className="text-lg font-medium text-slate-400">Aucune donnée disponible</p>
              <p className="text-sm text-slate-500 mt-1">
                Contactez l'administration pour lier vos enfants à votre compte
              </p>
            </div>
          </GlassCard>
        )
      )}

      {/* Section: notifications de disponibilités */}
      {parentSubmissions && parentSubmissions.length > 0 && (
        <GlassCard delay={0.3}>
          <div className="flex items-center gap-2 mb-3">
            <BellRing className="h-5 w-5 text-neon-cyan" />
            <div>
              <h3 className="text-white font-semibold tracking-tight">Notifications de disponibilités</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Les résultats des épreuves sont disponibles dès la notation
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all"
              onClick={() => navigate('/results')}
            >
              <ClipboardCheck className="h-8 w-8 text-green-400" />
              <div>
                <p className="font-medium text-white text-sm">Résultats disponibles</p>
                <p className="text-xs text-slate-500">
                  {parentSubmissions.length} épreuve(s) notée(s) — Cliquez pour voir
                </p>
              </div>
            </div>
            <div
              className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/[0.06] hover:border-white/10 transition-all"
              onClick={() => navigate('/quiz')}
            >
              <BellRing className="h-8 w-8 text-neon-cyan" />
              <div>
                <p className="font-medium text-white text-sm">Nouveaux quiz disponibles</p>
                <p className="text-xs text-slate-500">
                  Consultez les quiz pour vos enfants
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD COMPONENT
// ═══════════════════════════════════════════════════════════════

const AdminDashboardView = ({ navigate }: { navigate: any }) => {
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard delay={0} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">Utilisateurs</p>
            <Users className="h-4 w-4 text-neon-cyan" />
          </div>
          <div className="text-3xl font-bold text-white">—</div>
          <p className="text-xs text-slate-500 mt-1">Total des comptes sur la plateforme</p>
        </GlassCard>

        <GlassCard delay={0.1} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">Enseignants</p>
            <GraduationCap className="h-4 w-4 text-neon-violet" />
          </div>
          <div className="text-3xl font-bold text-white">—</div>
          <p className="text-xs text-slate-500 mt-1">Comptes enseignants actifs</p>
        </GlassCard>

        <GlassCard delay={0.2} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">Élèves</p>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-white">—</div>
          <p className="text-xs text-slate-500 mt-1">Comptes élèves inscrits</p>
        </GlassCard>

        <GlassCard delay={0.3} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">Quiz créés</p>
            <FileQuestion className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold text-white">—</div>
          <p className="text-xs text-slate-500 mt-1">Total quiz sur la plateforme</p>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard delay={0.1}>
          <h3 className="text-white font-semibold tracking-tight mb-1">Actions rapides</h3>
          <p className="text-sm text-slate-500 mb-4">Gestion de la plateforme</p>
          <div className="grid gap-2">
            <Button
              variant="secondary"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="mr-3 h-5 w-5 text-neon-cyan" />
              <div className="text-left">
                <p className="font-medium">Gérer les utilisateurs</p>
                <p className="text-xs text-slate-500">Créer, modifier, supprimer des comptes</p>
              </div>
            </Button>
            <Button
              variant="secondary"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate('/admin/branches')}
            >
              <GitBranch className="mr-3 h-5 w-5 text-neon-violet" />
              <div className="text-left">
                <p className="font-medium">Gérer les branches</p>
                <p className="text-xs text-slate-500">Organiser les classes et spécialités</p>
              </div>
            </Button>
            <Button
              variant="secondary"
              className="justify-start h-auto py-3 px-4"
              onClick={() => navigate('/quiz')}
            >
              <FileQuestion className="mr-3 h-5 w-5 text-green-500" />
              <div className="text-left">
                <p className="font-medium">Voir tous les quiz</p>
                <p className="text-xs text-slate-500">Superviser les quiz de la plateforme</p>
              </div>
            </Button>
          </div>
        </GlassCard>

        <GlassCard delay={0.2}>
          <h3 className="text-white font-semibold tracking-tight mb-1">Aperçu du système</h3>
          <p className="text-sm text-slate-500 mb-4">Informations générales</p>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-sm text-slate-400">Branches configurées</p>
              <p className="text-xl font-bold text-white mt-1">—</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-sm text-slate-400">Dernière activité</p>
              <p className="text-sm text-slate-500 mt-1">Connectez-vous à la base de données pour voir les statistiques</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Placeholder for future stats */}
      <GlassCard delay={0.3}>
        <h3 className="text-white font-semibold tracking-tight mb-1">Statistiques globales</h3>
        <p className="text-sm text-slate-500 mb-4">
          Les statistiques détaillées de la plateforme seront disponibles après intégration des données.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <Activity className="h-6 w-6 mx-auto text-slate-500 mb-2" />
            <p className="text-xs text-slate-500">Quiz complétés</p>
            <p className="text-lg font-bold text-white">—</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <Trophy className="h-6 w-6 mx-auto text-slate-500 mb-2" />
            <p className="text-xs text-slate-500">Moyenne générale</p>
            <p className="text-lg font-bold text-white">—%</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-slate-500 mb-2" />
            <p className="text-xs text-slate-500">Taux de participation</p>
            <p className="text-lg font-bold text-white">—%</p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
