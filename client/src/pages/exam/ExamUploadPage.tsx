import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, X, ArrowLeft, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Label } from '@components/ui/Label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { selectCurrentUser } from '@features/auth'
import { useGetBranchsQuery, useCreateExamWithFileMutation } from '@app/api'

export const ExamUploadPage = () => {
  const navigate = useNavigate()
  const user = useSelector(selectCurrentUser)
  const { data: branches } = useGetBranchsQuery()
  const [createExamWithFile, { isLoading }] = useCreateExamWithFileMutation()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [branchId, setBranchId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Veuillez entrer un titre pour l\'épreuve')
      return
    }

    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('teacher_id', user?.id || '')
      if (branchId) formData.append('branch_id', branchId)
      if (dueDate) formData.append('due_date', dueDate)
      if (file) formData.append('file', file)

      await createExamWithFile(formData).unwrap()

      toast.success('Épreuve créée avec succès')
      navigate('/examinations')
    } catch (err: any) {
      toast.error(err?.data?.error || 'Erreur lors de la création')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/examinations')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Publier une épreuve</h1>
          <p className="text-muted-foreground">
            Créez une épreuve pour vos étudiants
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Nouvelle épreuve
            </CardTitle>
            <CardDescription>
              Remplissez les informations de l'épreuve. Les étudiants pourront consulter et soumettre leur copie.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Titre de l'épreuve *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Évaluation N°2 - Mathématiques"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (optionnelle)</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[80px] p-3 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Instructions, consignes, barème..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="branch">Branche (optionnelle)</Label>
                <select
                  id="branch"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full h-10 px-3 border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="">Toutes les branches</option>
                  {branches?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="dueDate">Date limite</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* File upload area */}
            <div>
              <Label>Fichier de l'épreuve (optionnel)</Label>
              <div
                className={`mt-1 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                  ${file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files[0]
                  if (f && (f.type === 'application/pdf' || f.type.startsWith('image/') || f.type.includes('word'))) {
                    setFile(f)
                  } else {
                    toast.error('Format non supporté. Utilisez PDF ou image.')
                  }
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                    <p className="font-medium text-sm">Déposez votre fichier ici</p>
                    <p className="text-xs text-muted-foreground">
                      ou cliquez pour parcourir (PDF, JPG, PNG)
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/examinations')}
              >
                Annuler
              </Button>
              <Button type="submit" isLoading={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                Publier l'épreuve
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
