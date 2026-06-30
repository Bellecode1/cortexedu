import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ArrowLeft, CheckCircle, FileText, Download, Star, MessageSquare, GraduationCap, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Label } from '@components/ui/Label'
import { GlassCard } from '@components/ui/GlassCard'
import { selectCurrentUser } from '@features/auth'
import { useGetSubmissionsByExamQuery, useGradeSubmissionMutation } from '@app/api'
import { formatDateTime } from '@lib/utils'

export const GradeSubmissionsPage = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  const { data: submissions, isLoading, isError, error } = useGetSubmissionsByExamQuery(examId || '', {
    skip: !examId,
  })
  const [gradeSubmission, { isLoading: isGrading }] = useGradeSubmissionMutation()

  const [gradingId, setGradingId] = useState<string | null>(null)
  const [gradeValue, setGradeValue] = useState('')
  const [commentValue, setCommentValue] = useState('')

  const pendingCount = submissions?.filter(s => s.grade === null || s.grade === undefined).length || 0
  const gradedCount = (submissions?.length || 0) - pendingCount

  const handleGrade = async (submissionId: string) => {
    const grade = parseFloat(gradeValue)
    if (isNaN(grade) || grade < 0 || grade > 20) {
      toast.error('La note doit être comprise entre 0 et 20')
      return
    }
    try {
      await gradeSubmission({
        id: submissionId,
        data: {
          grade,
          comment: commentValue,
          graded_by: user?.id || '',
        },
      }).unwrap()
      toast.success('Copie notée avec succès')
      setGradingId(null)
      setGradeValue('')
      setCommentValue('')
    } catch (err: any) {
      toast.error(err?.data?.error || 'Erreur lors de la notation')
    }
  }

  const getGradeBadge = (grade: number | null | undefined) => {
    if (grade === null || grade === undefined) return null
    const pct = (grade / 20) * 100
    if (pct >= 80) return <span className="px-2 py-0.5 text-sm font-bold rounded-lg bg-green-500/10 text-green-400 border border-green-500/30">{grade}/20</span>
    if (pct >= 50) return <span className="px-2 py-0.5 text-sm font-bold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">{grade}/20</span>
    return <span className="px-2 py-0.5 text-sm font-bold rounded-lg bg-red-500/10 text-red-400 border border-red-500/30">{grade}/20</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/examinations')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Corriger les copies</h1>
          <p className="text-slate-500">Notez les copies soumises par les étudiants</p>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid gap-3 grid-cols-3">
        <GlassCard className="text-center py-3 space-y-1">
          <p className="text-2xl font-bold text-white">{submissions?.length || 0}</p>
          <p className="text-xs text-slate-500">Total copies</p>
        </GlassCard>
        <GlassCard className="text-center py-3 space-y-1">
          <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
          <p className="text-xs text-slate-500">En attente</p>
        </GlassCard>
        <GlassCard className="text-center py-3 space-y-1">
          <p className="text-2xl font-bold text-green-400">{gradedCount}</p>
          <p className="text-xs text-slate-500">Notées</p>
        </GlassCard>
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-semibold tracking-tight flex items-center gap-2">
              <FileText className="h-5 w-5 text-neon-cyan" />
              Copies soumises
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {submissions?.length || 0} copie(s) soumise(s)
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-slate-500">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-white/5 rounded w-1/3 mx-auto" />
              <div className="h-4 bg-white/5 rounded w-1/4 mx-auto" />
            </div>
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-red-500/50 mb-4" />
            <p className="text-lg font-medium text-red-400">Erreur de chargement</p>
            <p className="text-sm text-slate-500 mt-1">
              {(error as any)?.data?.error || 'Impossible de récupérer les soumissions. Veuillez réessayer.'}
            </p>
          </div>
        ) : !submissions || submissions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-slate-500/50 mb-4" />
            <p className="text-lg font-medium text-slate-400">Aucune copie soumise</p>
            <p className="text-sm text-slate-500 mt-1">Les étudiants n'ont pas encore soumis leurs copies</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => (
              <GlassCard key={sub.id} className="overflow-hidden">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5 text-neon-cyan" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {sub.student_name || 'Étudiant inconnu'}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Soumis le {formatDateTime(sub.submitted_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {sub.file_path && (
                      <a
                        href={`http://localhost:3000${sub.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/10 text-neon-cyan hover:bg-white/10 transition-colors"
                      >
                        <Download className="h-3 w-3" />
                        Copie
                      </a>
                    )}
                    {sub.grade !== null && sub.grade !== undefined ? (
                      <div className="text-right">
                        {getGradeBadge(sub.grade)}
                        {sub.comment && (
                          <p className="text-xs text-slate-500 mt-0.5 max-w-[200px] truncate">{sub.comment}</p>
                        )}
                      </div>
                    ) : (
                      <span className="px-3 py-1 text-xs rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
                        En attente
                      </span>
                    )}
                  </div>
                </div>

                {/* Grading form */}
                {gradingId === sub.id ? (
                  <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-400" />
                        Attribuer une note
                      </p>
                      <button
                        onClick={() => setGradingId(null)}
                        className="h-6 w-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-slate-400 mb-1.5 block">Note sur 20</Label>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={gradeValue}
                          onChange={(e) => setGradeValue(e.target.value)}
                          placeholder="0 - 20"
                          className="bg-navy-800/50 border-white/10 text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setGradingId(null)}
                        >
                          Annuler
                        </Button>
                        <Button
                          size="sm"
                          isLoading={isGrading}
                          onClick={() => handleGrade(sub.id)}
                          disabled={!gradeValue}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Noter
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-slate-400 mb-1.5 block flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3" />
                        Commentaire (optionnel)
                      </Label>
                      <textarea
                        value={commentValue}
                        onChange={(e) => setCommentValue(e.target.value)}
                        className="w-full min-h-[60px] p-2.5 rounded-xl bg-navy-800/50 border border-white/10 text-sm text-white placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-neon-cyan/50 transition-all"
                        placeholder="Observations, remarques..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {(sub.grade === null || sub.grade === undefined) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setGradingId(sub.id)
                          setGradeValue('')
                          setCommentValue('')
                        }}
                      >
                        <Star className="mr-1 h-3 w-3" />
                        Noter cette copie
                      </Button>
                    )}
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
