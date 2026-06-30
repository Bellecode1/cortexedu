import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Upload, FileText, ArrowLeft, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { Badge } from '@components/ui/Badge'
import { selectCurrentUser } from '@features/auth'
import { useGetExamsQuery, useCreateSubmissionWithFileMutation, useGetSubmissionsByStudentQuery } from '@app/api'
import { formatDateTime } from '@lib/utils'

export const ExamSubmitPage = () => {
  const { examId } = useParams<{ examId: string }>()
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)

  const { data: allExams } = useGetExamsQuery()
  const { data: studentSubmissions } = useGetSubmissionsByStudentQuery(user?.id || '', {
    skip: !user?.id,
  })
  const [createSubmissionWithFile, { isLoading }] = useCreateSubmissionWithFileMutation()

  const [file, setFile] = useState<File | null>(null)

  const exam = useMemo(() => allExams?.find(e => e.id === examId), [allExams, examId])
  const existingSubmission = useMemo(
    () => studentSubmissions?.find(s => s.exam_id === examId),
    [studentSubmissions, examId]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !examId) return

    try {
      const formData = new FormData()
      formData.append('exam_id', examId)
      formData.append('student_id', user.id)
      if (file) formData.append('file', file)

      await createSubmissionWithFile(formData).unwrap()
      toast.success('Copie soumise avec succès!')
      navigate('/examinations')
    } catch (err: any) {
      toast.error(err?.data?.error || 'Erreur lors de la soumission')
    }
  }

  if (!exam) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold">Épreuve non trouvée</h2>
        <Button className="mt-4" variant="outline" onClick={() => navigate('/examinations')}>
          Retour aux épreuves
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/examinations')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Soumettre ma copie</h1>
          <p className="text-muted-foreground">{exam.title}</p>
        </div>
      </div>

      {/* Exam Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {exam.title}
          </CardTitle>
          <CardDescription>
            {exam.description || 'Aucune description'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Publiée le {formatDateTime(exam.created_at)}</span>
            {exam.due_date && (
              <Badge variant="outline">Date limite: {formatDateTime(exam.due_date)}</Badge>
            )}
          </div>
          {exam.file_path && (
            <a
              href={`http://localhost:3000${exam.file_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium"
            >
              <Download className="h-4 w-4" />
              Télécharger le sujet
            </a>
          )}
        </CardContent>
      </Card>

      {/* Existing Submission Status */}
      {existingSubmission && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">Copie déjà soumise</p>
                <p className="text-sm text-green-600">
                  Soumise le {formatDateTime(existingSubmission.submitted_at)}
                  {existingSubmission.grade !== null && ` — Notée ${existingSubmission.grade}/20`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submission Form */}
      {!existingSubmission && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Soumettre votre copie</CardTitle>
              <CardDescription>
                Déposez votre fichier au format PDF ou image
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer
                  ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f && (f.type === 'application/pdf' || f.type.startsWith('image/'))) {
                    setFile(f)
                  } else {
                    toast.error('Format non supporté. Utilisez PDF ou image.')
                  }
                }}
                onClick={() => document.getElementById('submit-file')?.click()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-10 w-10 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <div>
                      <p className="font-medium">Déposez votre copie ici</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        ou cliquez pour parcourir (PDF, JPG, PNG - max 10MB)
                      </p>
                    </div>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="submit-file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/examinations')}
                >
                  Annuler
                </Button>
                <Button type="submit" isLoading={isLoading} disabled={!file}>
                  <Upload className="mr-2 h-4 w-4" />
                  Soumettre ma copie
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  )
}
