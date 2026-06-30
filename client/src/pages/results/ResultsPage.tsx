import { useState, useMemo, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Clock,
  CheckCircle,
  BarChart3,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  FileText,
  Hourglass,
  Download,
  ClipboardCheck,
  TrendingUp,
  BookOpen,
  GraduationCap,
  PieChart,
  Target,
  Award,
  BarChartHorizontal,
  Check,
  HelpCircle,
} from 'lucide-react'
import { Dialog } from '@components/ui/Dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/Table'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Badge } from '@components/ui/Badge'
import { GlassCard } from '@components/ui/GlassCard'
import { selectCurrentUser, selectIsParent, selectIsStudent, selectIsTeacher, selectIsAdmin } from '@features/auth'
import {
  useGetResultsByUserQuery,
  useGetResultsByParentQuery,
  useGetResultsByAuthorQuery,
  useGetSubmissionsByStudentQuery,
  useGetSubmissionsByParentQuery,
  useGetSubmissionsByTeacherQuery,
} from '@app/api'
import { formatDate, formatDateTime, cn } from '@lib/utils'
import type { StudentQuizResult } from '@/types'
import { ProgressChart } from '@components/charts/ProgressChart'

// ─── Constants ───
const QUIZ_RESULTS_PER_PAGE = 8

// ─── Types ───
type ResultsTab = 'quiz' | 'exam'
type ExamFilterStatus = 'all' | 'graded' | 'pending'
type ExamSortKey = 'date-desc' | 'date-asc' | 'grade-desc' | 'grade-asc'

interface DisplayQuizResult {
  id: string
  studentId: string
  quizId: string
  name: string
  score: string
  createAt: string
  percent: number
  studentName?: string
}

// ─── Helpers ───

const parseScore = (score: string | undefined | null) => {
  if (!score) return { correct: 0, total: 1 }
  const parts = score.split('/')
  return {
    correct: parseInt(parts[0]) || 0,
    total: parseInt(parts[1]) || 1,
  }
}

const getScoreBadge = (percent: number) => {
  if (percent >= 80) return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>
  if (percent >= 60) return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Bien</Badge>
  if (percent >= 40) return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Passable</Badge>
  return <Badge variant="destructive">Échec</Badge>
}

const toDisplayQuizResult = (r: StudentQuizResult): DisplayQuizResult => ({
  id: r.id,
  studentId: r.studentId,
  quizId: r.quizId,
  name: r.name,
  score: r.score,
  createAt: r.createAt,
  percent: r.percent || 0,
})

const getGradeColor = (grade: number) => {
  const pct = (grade / 20) * 100
  if (pct >= 80) return 'text-green-400'
  if (pct >= 60) return 'text-blue-400'
  if (pct >= 50) return 'text-amber-400'
  return 'text-red-400'
}

const getGradeBadge = (grade: number) => {
  const pct = (grade / 20) * 100
  if (pct >= 80) return 'bg-green-500/10 text-green-400 border-green-500/30'
  if (pct >= 60) return 'bg-blue-500/10 text-blue-400 border-blue-500/30'
  if (pct >= 50) return 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  return 'bg-red-500/10 text-red-400 border-red-500/30'
}

// ─── Tab Headers ───
const tabOptions: { value: ResultsTab; label: string; icon: React.ReactNode }[] = [
  { value: 'quiz', label: 'Quiz', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'exam', label: 'Épreuves', icon: <FileText className="h-4 w-4" /> },
]

// ═══════════════════════════════════════════════════════════════
// GLOBAL STATISTICS – combine quiz + exam data
// ═══════════════════════════════════════════════════════════════

interface GlobalStats {
  totalAssessments: number
  quizCount: number
  examCount: number
  overallAveragePercent: number
  bestPercent: number
  distribution: { label: string; count: number; color: string }[]
}

const DISTRIBUTION_RANGES = [
  { min: 80, max: 101, label: 'Excellent', color: 'bg-green-500' },
  { min: 60, max: 80, label: 'Bien', color: 'bg-blue-500' },
  { min: 40, max: 60, label: 'Passable', color: 'bg-yellow-500' },
  { min: 20, max: 40, label: 'Faible', color: 'bg-orange-500' },
  { min: 0, max: 20, label: 'Insuffisant', color: 'bg-red-500' },
]

const GlobalStatsSection = () => {
  const user = useSelector(selectCurrentUser)
  const isStudent = useSelector(selectIsStudent)
  const isParent = useSelector(selectIsParent)
  const isTeacher = useSelector(selectIsTeacher)
  const isAdmin = useSelector(selectIsAdmin)
  const isTeacherOrAdmin = isTeacher || isAdmin

  // ─── Quiz results ───
  const { data: rawStudentResults } = useGetResultsByUserQuery(user?.id || '', {
    skip: !isStudent || !user?.id,
  })
  const { data: parentApiResults } = useGetResultsByParentQuery(user?.id || '', {
    skip: !isParent || !user?.id,
  })
  const { data: authorResults } = useGetResultsByAuthorQuery(user?.id || '', {
    skip: !isTeacherOrAdmin || !user?.id,
  })

  // ─── Exam submissions ───
  const { data: studentSubmissions } = useGetSubmissionsByStudentQuery(user?.id || '', {
    skip: !isStudent || !user?.id,
  })
  const { data: parentSubmissions } = useGetSubmissionsByParentQuery(user?.id || '', {
    skip: !isParent || !user?.id,
  })
  const { data: teacherSubmissions } = useGetSubmissionsByTeacherQuery(user?.id || '', {
    skip: !isTeacherOrAdmin || !user?.id,
  })

  // ─── Extract quiz percents ───
  const quizPercents = useMemo<number[]>(() => {
    if (isStudent && rawStudentResults) {
      return rawStudentResults.map(r => r.percent || 0)
    }
    if (isParent && parentApiResults) {
      const percents: number[] = []
      for (const entry of parentApiResults as any[]) {
        for (const qr of entry.quizResults || []) {
          percents.push(qr.percent || 0)
        }
      }
      return percents
    }
    if (isTeacherOrAdmin && authorResults) {
      return (authorResults as any[]).map(r => r.percent || 0)
    }
    return []
  }, [isStudent, isParent, isTeacherOrAdmin, rawStudentResults, parentApiResults, authorResults])

  // ─── Extract exam percents (grade/20 → %) ───
  const examPercents = useMemo<number[]>(() => {
    let subs: any[] = []
    if (isStudent) subs = studentSubmissions || []
    else if (isParent) subs = parentSubmissions || []
    else if (isTeacherOrAdmin) subs = teacherSubmissions || []

    return subs
      .filter((s: any) => s.grade !== null && s.grade !== undefined)
      .map((s: any) => Math.round((s.grade / 20) * 100))
  }, [isStudent, isParent, isTeacherOrAdmin, studentSubmissions, parentSubmissions, teacherSubmissions])

  // ─── Progression chart data ───
  const progressionData = useMemo(() => {
    const points: { name: string; score: number; date?: string }[] = []
    if (isStudent && rawStudentResults) {
      for (const r of rawStudentResults) {
        points.push({
          name: r.name?.substring(0, 14) || 'Quiz',
          score: r.percent || 0,
          date: r.createAt,
        })
      }
    }
    // Sort by date ascending
    points.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
    return points.slice(-10) // last 10
  }, [isStudent, rawStudentResults])

  // ─── Combine stats ───
  const globalStats = useMemo<GlobalStats | null>(() => {
    const allPercents = [...quizPercents, ...examPercents]
    if (allPercents.length === 0) return null

    const total = allPercents.length
    const sum = allPercents.reduce((a, b) => a + b, 0)
    const best = Math.max(...allPercents)

    // Distribution
    const dist = DISTRIBUTION_RANGES.map(range => ({
      ...range,
      count: allPercents.filter(p => p >= range.min && p < range.max).length,
    }))

    return {
      totalAssessments: total,
      quizCount: quizPercents.length,
      examCount: examPercents.length,
      overallAveragePercent: Math.round(sum / total),
      bestPercent: best,
      distribution: dist,
    }
  }, [quizPercents, examPercents])

  if (!globalStats || globalStats.totalAssessments === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-5 w-5 text-neon-cyan" />
          <h2 className="text-lg font-semibold text-white">
            Statistiques globales
          </h2>
          <span className="text-xs text-slate-500 ml-1">
            ({globalStats.totalAssessments} évaluation{globalStats.totalAssessments > 1 ? 's' : ''})
          </span>
        </div>

        {/* Top-level metric cards */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-5">
          {[
            { icon: <Target className="h-5 w-5 text-neon-cyan" />, value: `${globalStats.overallAveragePercent}%`, label: 'Moyenne générale', delay: 0 },
            { icon: <Award className="h-5 w-5 text-yellow-400" />, value: `${globalStats.bestPercent}%`, label: 'Meilleur score', delay: 0.1 },
            { icon: <BookOpen className="h-5 w-5 text-blue-400" />, value: `${globalStats.quizCount}`, label: 'Quiz notés', delay: 0.2 },
            { icon: <FileText className="h-5 w-5 text-violet-400" />, value: `${globalStats.examCount}`, label: 'Épreuves notées', delay: 0.3 },
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: item.delay, ease: 'easeOut' }}
              className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300"
            >
              <div className="mb-1">{item.icon}</div>
              <div className="text-2xl font-bold text-white">{item.value}</div>
              <p className="text-[10px] text-slate-500">{item.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Distribution bars */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <BarChartHorizontal className="h-4 w-4 text-slate-500" />
            <p className="text-xs font-medium text-slate-400">Répartition des scores</p>
          </div>
          <div className="space-y-1.5">
            {globalStats.distribution.map((d, i) => {
              const pct = globalStats.totalAssessments > 0
                ? Math.round((d.count / globalStats.totalAssessments) * 100)
                : 0
              return (
                <motion.div
                  key={d.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + i * 0.08, ease: 'easeOut' }}
                  className="flex items-center gap-2"
                >
                  <span className="text-[11px] text-slate-500 w-20 flex-shrink-0">{d.label}</span>
                  <div className="flex-1 h-5 rounded-full bg-white/5 overflow-hidden relative group">
                    <div
                      className={`h-full rounded-full ${d.color} transition-all duration-700 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 rounded-full" />
                  </div>
                  <span className="text-[11px] text-slate-400 w-8 text-right flex-shrink-0">
                    {d.count}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Progression chart */}
        {progressionData.length >= 2 && (
          <ProgressChart
            data={progressionData}
            title="Évolution des scores (quiz)"
            height={220}
          />
        )}
      </GlassCard>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const ResultsPage = () => {
  const isParent = useSelector(selectIsParent)
  const isTeacher = useSelector(selectIsTeacher)
  const isAdmin = useSelector(selectIsAdmin)

  const [activeTab, setActiveTab] = useState<ResultsTab>('quiz')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Résultats</h1>
        <p className="text-muted-foreground">
          {isTeacher || isAdmin
            ? 'Analysez les performances de vos étudiants'
            : isParent
              ? 'Suivez les progrès de vos enfants (quiz et épreuves)'
              : 'Consultez vos résultats aux quiz et épreuves'}
        </p>
      </div>

      {/* Combined global statistics */}
      <GlobalStatsSection />

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10 w-fit"
      >
        {tabOptions.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
              activeTab === tab.value
                ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Animated Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {activeTab === 'quiz' && <QuizResultsSection />}
          {activeTab === 'exam' && <ExamResultsSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// QUIZ DETAIL DIALOG
// ═══════════════════════════════════════════════════════════════

interface QuizDetailDialogProps {
  result: any
  onClose: () => void
}

const QuizDetailDialog = ({ result, onClose }: QuizDetailDialogProps) => {
  const questions = result.quizQuestions || []
  const totalMarks = questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0)
  const earnedMarks = questions.reduce((sum: number, q: any) => {
    const isCorrect = q.userAnswer !== undefined && q.userAnswer === q.correctAnswer
    return sum + (isCorrect ? (q.marks || 0) : 0)
  }, 0)
  const { correct, total } = parseScore(result.score)

  return (
    <Dialog
      open={!!result}
      onClose={onClose}
      title={result.name || 'Détails du quiz'}
      description={`${formatDate(result.createAt)} — ${result.percent}% (${result.score || '—'})`}
      className="max-w-2xl max-h-[80vh] overflow-y-auto !bg-navy-900 !text-white border border-white/10"
    >
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
          <p className="text-lg font-bold text-green-400">{correct}</p>
          <p className="text-[10px] text-green-400/70">Correctes</p>
        </div>
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
          <p className="text-lg font-bold text-red-400">{total - correct}</p>
          <p className="text-[10px] text-red-400/70">Fausses</p>
        </div>
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
          <p className="text-lg font-bold text-blue-400">{earnedMarks}/{totalMarks}</p>
          <p className="text-[10px] text-blue-400/70">Points</p>
        </div>
      </div>

      {/* Feedback */}
      {result.feedback && (
        <div className="mb-4 p-2 rounded-lg bg-white/5 border border-white/10 text-center">
          <p className="text-sm font-medium text-slate-300">{result.feedback}</p>
        </div>
      )}

      {/* Questions list */}
      {questions.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Aucun détail de réponse disponible pour ce quiz.
        </p>
      ) : (
        <div className="space-y-3">
          {questions.map((q: any, idx: number) => {
            const userChoice = q.userAnswer
            const isCorrect = userChoice !== undefined && userChoice === q.correctAnswer
            const isUnanswered = userChoice === undefined || userChoice === null

            return (
              <div
                key={q.id || idx}
                className={cn(
                  'p-3 rounded-xl border transition-colors',
                  isUnanswered
                    ? 'bg-slate-500/5 border-slate-500/20'
                    : isCorrect
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                )}
              >
                {/* Question header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-slate-300">
                      {idx + 1}
                    </span>
                    <p className="text-sm font-medium text-white">
                      {q.mainQuestion}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-[10px] text-slate-500">{q.marks || 0}pt{q.marks !== 1 ? 's' : ''}</span>
                    {isUnanswered ? (
                      <HelpCircle className="h-4 w-4 text-slate-500" />
                    ) : isCorrect ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                  </div>
                </div>

                {/* Choices */}
                <div className="ml-8 space-y-1">
                  {q.choices?.map((choice: string, ci: number) => {
                    const isUserChoice = userChoice === ci
                    const isCorrectChoice = q.correctAnswer === ci

                    return (
                      <div
                        key={ci}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors',
                          isCorrectChoice && isUserChoice
                            ? 'bg-green-500/15 text-green-300 border border-green-500/30'
                            : isCorrectChoice
                              ? 'bg-green-500/10 text-green-300/70 border border-green-500/20'
                              : isUserChoice && !isCorrect
                                ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                                : 'bg-white/5 text-slate-400 border border-white/10'
                        )}
                      >
                        <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] flex-shrink-0">
                          {String.fromCharCode(65 + ci)}
                        </span>
                        <span className="flex-1">{choice}</span>
                        {isCorrectChoice && <Check className="h-3 w-3 text-green-400 flex-shrink-0" />}
                        {isUserChoice && !isCorrectChoice && (
                          <X className="h-3 w-3 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════
// QUIZ RESULTS SECTION
// ═══════════════════════════════════════════════════════════════

const QuizResultsSection = () => {
  const user = useSelector(selectCurrentUser)
  const isStudent = useSelector(selectIsStudent)
  const isParent = useSelector(selectIsParent)
  const isTeacher = useSelector(selectIsTeacher)
  const isAdmin = useSelector(selectIsAdmin)
  const isTeacherOrAdmin = isTeacher || isAdmin

  // Filters
  const [filterQuiz, setFilterQuiz] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterStudent, setFilterStudent] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Selected result for detail dialog
  const [selectedResult, setSelectedResult] = useState<any | null>(null)

  // Student results
  const { data: rawStudentResults } = useGetResultsByUserQuery(user?.id || '', {
    skip: !isStudent || !user?.id,
  })

  // Parent results
  const { data: parentApiResults } = useGetResultsByParentQuery(user?.id || '', {
    skip: !isParent || !user?.id,
  })

  // Teacher / Admin results
  const { data: authorResults } = useGetResultsByAuthorQuery(user?.id || '', {
    skip: !isTeacherOrAdmin || !user?.id,
  })

  // Normalize results
  const results = useMemo<DisplayQuizResult[]>(() => {
    if (isStudent && rawStudentResults) {
      return rawStudentResults.map(toDisplayQuizResult)
    }
    if (isParent && parentApiResults) {
      const flat: DisplayQuizResult[] = []
      for (const entry of parentApiResults as any[]) {
        const studentName = entry.student
          ? `${entry.student.name || ''} ${entry.student.surname || ''}`.trim()
          : 'Inconnu'
        for (const qr of entry.quizResults || []) {
          flat.push({
            ...toDisplayQuizResult(qr),
            studentId: `${studentName} (${qr.studentId})`,
            studentName,
          })
        }
      }
      return flat
    }
    if (isTeacherOrAdmin && authorResults) {
      return (authorResults as any[]).map((r: any) => ({
        id: r.id || '',
        studentId: r.studentId || '',
        quizId: r.quizId || '',
        name: r.name || 'Quiz',
        score: r.score || '0/0',
        createAt: r.createAt || r.create_At || '',
        percent: r.percent || 0,
        studentName: r.studentName || r.studentId,
      }))
    }
    return []
  }, [isStudent, isParent, isTeacherOrAdmin, rawStudentResults, parentApiResults, authorResults])

  // Unique quiz names for filter
  const uniqueQuizNames = useMemo(() => {
    const names = new Set(results.map(r => r.name))
    return Array.from(names).sort()
  }, [results])

  // Apply filters
  const filteredResults = useMemo(() => {
    let filtered = [...results]

    if (filterQuiz) {
      filtered = filtered.filter(r => r.name === filterQuiz)
    }
    if (filterStartDate) {
      const start = new Date(filterStartDate)
      filtered = filtered.filter(r => new Date(r.createAt) >= start)
    }
    if (filterEndDate) {
      const end = new Date(filterEndDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(r => new Date(r.createAt) <= end)
    }
    if (filterStudent) {
      filtered = filtered.filter(r =>
        (r.studentName || r.studentId).toLowerCase().includes(filterStudent.toLowerCase())
      )
    }

    filtered.sort((a, b) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime())
    return filtered
  }, [results, filterQuiz, filterStartDate, filterEndDate, filterStudent])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / QUIZ_RESULTS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedResults = useMemo(() => {
    const start = (safePage - 1) * QUIZ_RESULTS_PER_PAGE
    return filteredResults.slice(start, start + QUIZ_RESULTS_PER_PAGE)
  }, [filteredResults, safePage])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterQuiz, filterStartDate, filterEndDate, filterStudent])

  // Stats
  const stats = useMemo(() => {
    if (filteredResults.length === 0) return { count: 0, average: 0, best: 0 }
    const scores = filteredResults.map(r => r.percent)
    return {
      count: filteredResults.length,
      average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      best: Math.max(...scores),
    }
  }, [filteredResults])

  const hasActiveFilters = filterQuiz || filterStartDate || filterEndDate || filterStudent

  const clearFilters = () => {
    setFilterQuiz('')
    setFilterStartDate('')
    setFilterEndDate('')
    setFilterStudent('')
    setCurrentPage(1)
  }

  const resetPage = () => setCurrentPage(1)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {filteredResults.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />, title: 'Résultats', value: stats.count, subtitle: hasActiveFilters && filteredResults.length < results.length ? `/ ${results.length}` : null, delay: 0 },
            { icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />, title: 'Score moyen', value: `${stats.average}%`, delay: 0.1 },
            { icon: <Trophy className="h-4 w-4 text-muted-foreground" />, title: 'Meilleur score', value: `${stats.best}%`, delay: 0.2 },
          ].map((card) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, delay: card.delay, ease: 'easeOut' }}
            >
              <Card className="hover:shadow-lg hover:shadow-neon-cyan/5 transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  {card.icon}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {card.value}
                    {card.subtitle && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">{card.subtitle}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
      <Card className="hover:shadow-lg hover:shadow-neon-cyan/5 transition-all duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtres
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                <X className="h-3 w-3" />
                Réinitialiser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {/* Filter by quiz */}
            <div className="flex-1 min-w-[160px]">
              <label className="text-xs text-muted-foreground mb-1 block">Quiz</label>
              <select
                value={filterQuiz}
                onChange={(e) => { setFilterQuiz(e.target.value); resetPage() }}
                className="w-full h-9 px-3 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Tous les quiz</option>
                {uniqueQuizNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {/* Filter by start date */}
            <div className="min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">Du</label>
              <Input
                type="date"
                value={filterStartDate}
                onChange={(e) => { setFilterStartDate(e.target.value); resetPage() }}
                className="h-9 text-sm"
              />
            </div>

            {/* Filter by end date */}
            <div className="min-w-[140px]">
              <label className="text-xs text-muted-foreground mb-1 block">Au</label>
              <Input
                type="date"
                value={filterEndDate}
                onChange={(e) => { setFilterEndDate(e.target.value); resetPage() }}
                className="h-9 text-sm"
              />
            </div>

            {/* Filter by student */}
            {(isParent || isTeacher || isAdmin) && (
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-muted-foreground mb-1 block">Étudiant</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={filterStudent}
                    onChange={(e) => { setFilterStudent(e.target.value); resetPage() }}
                    placeholder="Rechercher..."
                    className="w-full h-9 pl-8 pr-3 text-sm border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Results Table */}
      <Card className="hover:shadow-lg hover:shadow-neon-cyan/5 transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historique des quiz</CardTitle>
            <CardDescription>
              {filteredResults.length > 0
                ? `${filteredResults.length} résultat(s) trouvé(s)${hasActiveFilters ? ' (filtrés)' : ''}`
                : 'Aucun résultat pour le moment'}
            </CardDescription>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Page {safePage}/{totalPages}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredResults.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quiz</TableHead>
                    {(isParent || isTeacher || isAdmin) && <TableHead>Étudiant</TableHead>}
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Niveau</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedResults.map((result, idx) => {
                    const { correct, total } = parseScore(result.score)
                    return (
                      <motion.tr
                        key={result.id || `${result.studentId}-${result.quizId}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: idx * 0.05, ease: 'easeOut' }}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          // Find the full result data from the appropriate source
                          if (isStudent && rawStudentResults) {
                            const full = rawStudentResults.find(r => r.id === result.id)
                            if (full) setSelectedResult(full)
                          } else if (isParent && parentApiResults) {
                            for (const entry of parentApiResults as any[]) {
                              const qr = (entry.quizResults || []).find((r: any) => r.id === result.id)
                              if (qr) {
                                setSelectedResult({ ...qr, studentName: result.studentName })
                                break
                              }
                            }
                          } else if (isTeacherOrAdmin && authorResults) {
                            const full = (authorResults as any[]).find(r => r.id === result.id)
                            if (full) setSelectedResult(full)
                          }
                        }}
                      >
                        <TableCell className="font-medium">{result.name}</TableCell>
                        {(isParent || isTeacher || isAdmin) && (
                          <TableCell className="text-muted-foreground">
                            {result.studentName || result.studentId}
                          </TableCell>
                        )}
                        <TableCell>{formatDate(result.createAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{result.percent}%</span>
                            <span className="text-muted-foreground text-sm">
                              ({correct}/{total})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getScoreBadge(result.percent)}</TableCell>
                      </motion.tr>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage {(safePage - 1) * QUIZ_RESULTS_PER_PAGE + 1}–
                    {Math.min(safePage * QUIZ_RESULTS_PER_PAGE, filteredResults.length)} sur{' '}
                    {filteredResults.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage(safePage - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (safePage <= 3) {
                        pageNum = i + 1
                      } else if (safePage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = safePage - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={safePage === pageNum ? 'default' : 'outline'}
                          size="icon"
                          className="h-8 w-8 text-xs"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage(safePage + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Aucun résultat ne correspond aux filtres sélectionnés.'
                  : "Vous n'avez pas encore complété de quiz."}
              </p>
              {hasActiveFilters && (
                <Button variant="link" size="sm" className="mt-2" onClick={clearFilters}>
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiz Detail Dialog */}
      {selectedResult && (
        <QuizDetailDialog
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// EXAM RESULTS SECTION
// ═══════════════════════════════════════════════════════════════

const ExamResultsSection = () => {
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const isStudent = useSelector(selectIsStudent)
  const isParent = useSelector(selectIsParent)
  const isTeacher = useSelector(selectIsTeacher)
  const isAdmin = useSelector(selectIsAdmin)
  const isTeacherOrAdmin = isTeacher || isAdmin

  // Fetch submissions based on role
  const { data: studentSubmissions, isLoading: isLoadingStudent } = useGetSubmissionsByStudentQuery(user?.id || '', {
    skip: !isStudent || !user?.id,
  })

  const { data: parentSubmissions, isLoading: isLoadingParent } = useGetSubmissionsByParentQuery(user?.id || '', {
    skip: !isParent || !user?.id,
  })

  const { data: teacherSubmissions, isLoading: isLoadingTeacher } = useGetSubmissionsByTeacherQuery(user?.id || '', {
    skip: !isTeacherOrAdmin || !user?.id,
  })

  // Determine which data source to use
  const submissions = useMemo(() => {
    if (isStudent) return studentSubmissions
    if (isParent) return parentSubmissions
    if (isTeacherOrAdmin) return teacherSubmissions
    return []
  }, [isStudent, isParent, isTeacherOrAdmin, studentSubmissions, parentSubmissions, teacherSubmissions])

  const isLoading = isLoadingStudent || isLoadingParent || isLoadingTeacher

  // Filters & Sort
  const [statusFilter, setStatusFilter] = useState<ExamFilterStatus>('all')
  const [sortKey, setSortKey] = useState<ExamSortKey>('date-desc')
  const [searchQuery, setSearchQuery] = useState('')

  // Stats
  const stats = useMemo(() => {
    if (!submissions || submissions.length === 0) {
      return { total: 0, graded: 0, pending: 0, average: 0 }
    }
    const graded = submissions.filter((s: any) => s.grade !== null && s.grade !== undefined)
    const pending = submissions.length - graded.length
    const avg = graded.length > 0
      ? Math.round(graded.reduce((sum: number, s: any) => sum + (s.grade || 0), 0) / graded.length * 10) / 10
      : 0
    return { total: submissions.length, graded: graded.length, pending, average: avg }
  }, [submissions])

  // Filtered & Sorted
  const filteredSubmissions = useMemo(() => {
    if (!submissions) return []

    let filtered = [...submissions]

    // Status filter
    if (statusFilter === 'graded') {
      filtered = filtered.filter((s: any) => s.grade !== null && s.grade !== undefined)
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter((s: any) => s.grade === null || s.grade === undefined)
    }

    // Search by exam title
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((s: any) =>
        (s.exam_title || '').toLowerCase().includes(q)
      )
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      switch (sortKey) {
        case 'date-asc':
          return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
        case 'date-desc':
          return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        case 'grade-asc': {
          const gA = a.grade ?? -1
          const gB = b.grade ?? -1
          return gA - gB
        }
        case 'grade-desc': {
          const gA = a.grade ?? -1
          const gB = b.grade ?? -1
          return gB - gA
        }
        default:
          return 0
      }
    })

    return filtered
  }, [submissions, statusFilter, sortKey, searchQuery])

  useEffect(() => {
    setSearchQuery('')
  }, [statusFilter])

  const statusFilterOptions: { value: ExamFilterStatus; label: string; count: number }[] = [
    { value: 'all', label: 'Toutes', count: stats.total },
    { value: 'graded', label: 'Notées', count: stats.graded },
    { value: 'pending', label: 'En attente', count: stats.pending },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded w-1/3" />
          <div className="h-4 bg-white/5 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {submissions && submissions.length > 0 && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <GlassCard className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Total copies</p>
              <FileText className="h-4 w-4 text-neon-cyan" />
            </div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-slate-500">copies soumises</p>
          </GlassCard>

          <GlassCard className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Notées</p>
              <ClipboardCheck className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.graded}</div>
            <p className="text-xs text-slate-500">copies corrigées</p>
          </GlassCard>

          <GlassCard className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">En attente</p>
              <Hourglass className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400">{stats.pending}</div>
            <p className="text-xs text-slate-500">en cours de correction</p>
          </GlassCard>

          <GlassCard className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">Moyenne</p>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white">
              {stats.graded > 0 ? `${stats.average}/20` : '—'}
            </div>
            <div className="w-full bg-navy-700/50 rounded-full h-1.5 mt-1">
              {stats.graded > 0 && (
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${(stats.average / 20) * 100}%` }}
                />
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Content Card */}
      <GlassCard>
        {/* Filters & Sort Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-navy-900/50 border border-white/5">
            {statusFilterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap',
                  statusFilter === opt.value
                    ? 'bg-white/10 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                {opt.label}
                <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-white/5 text-[10px]">
                  {opt.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search + Sort */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full sm:w-[180px] h-8 pl-8 pr-2 text-xs rounded-lg bg-navy-800/50 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as ExamSortKey)}
              className="h-8 px-2 text-xs rounded-lg bg-navy-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan/50"
            >
              <option value="date-desc">Date ↓</option>
              <option value="date-asc">Date ↑</option>
              <option value="grade-desc">Note ↓</option>
              <option value="grade-asc">Note ↑</option>
            </select>
          </div>
        </div>

        {/* Submissions List */}
        {!submissions || submissions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-slate-500/50" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-1">Aucune copie soumise</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {isParent
                ? 'Aucun de vos enfants n\'a encore soumis de copie.'
                : "Vous n'avez encore soumis aucune copie. Rendez-vous dans la section Épreuves pour commencer."}
            </p>
            {isStudent && (
              <Button className="mt-6" onClick={() => navigate('/examinations')}>
                Voir les épreuves
              </Button>
            )}
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <Filter className="h-10 w-10 mx-auto text-slate-500/50 mb-3" />
            <p className="text-slate-400 font-medium">Aucun résultat avec ces filtres</p>
            <p className="text-sm text-slate-500 mt-1">Essayez de modifier vos critères de recherche</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => { setStatusFilter('all'); setSearchQuery('') }}
            >
              <X className="mr-1 h-3 w-3" />
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubmissions.map((sub: any) => (
              <div
                key={sub.id}
                className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200 cursor-pointer"
                onClick={() => isStudent ? navigate(`/examinations/submit/${sub.exam_id}`) : undefined}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Icon + Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                      sub.grade !== null && sub.grade !== undefined
                        ? 'bg-green-500/10'
                        : 'bg-amber-500/10'
                    )}>
                      {sub.grade !== null && sub.grade !== undefined ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <Hourglass className="h-5 w-5 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white truncate group-hover:text-neon-cyan transition-colors">
                        {sub.exam_title || 'Épreuve'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Soumise le {formatDateTime(sub.submitted_at)}
                        </span>
                        {sub.student_name && (isParent || isTeacherOrAdmin) && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {sub.student_name}
                          </span>
                        )}
                        {sub.file_path && (
                          <a
                            href={`http://localhost:3000${sub.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-neon-cyan hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-3 w-3" />
                            Ma copie
                          </a>
                        )}
                      </div>
                      {sub.grade !== null && sub.grade !== undefined && sub.comment && (
                        <p className="text-xs text-slate-500 mt-2 italic line-clamp-2">
                          "{sub.comment}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Grade / Status */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {sub.grade !== null && sub.grade !== undefined ? (
                      <div className="text-right">
                        <span className={cn(
                          'text-2xl font-bold',
                          getGradeColor(sub.grade)
                        )}>
                          {sub.grade}
                          <span className="text-sm font-normal text-slate-500">/20</span>
                        </span>
                        <div className={cn(
                          'mt-1 px-2 py-0.5 text-xs rounded-lg border text-center font-medium',
                          getGradeBadge(sub.grade)
                        )}>
                          {Math.round((sub.grade / 20) * 100)}%
                        </div>
                      </div>
                    ) : (
                      <span className="px-3 py-1.5 text-xs rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium whitespace-nowrap">
                        En attente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Count footer */}
        {filteredSubmissions.length > 0 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
            <p className="text-xs text-slate-500">
              {filteredSubmissions.length} résultat{filteredSubmissions.length > 1 ? 's' : ''}
              {filteredSubmissions.length < (submissions?.length || 0) && (
                <span className="text-slate-600"> sur {submissions?.length || 0}</span>
              )}
            </p>
            <p className="text-xs text-slate-600">
              {isStudent ? 'Cliquez sur une copie pour voir les détails' : ''}
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
