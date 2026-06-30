import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'sonner'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Label } from '@components/ui/Label'
import { Select } from '@components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card'
import { quizSchema } from '@lib/validators'
import { selectCurrentUser } from '@features/auth'
import { useCreateQuizMutation, useUpdateQuizMutation, useGetBranchsQuery } from '@app/api'

interface QuizFormData {
  name: string
  description: string
  branchId: string[]
  startDate: string
  endDate: string
  typeOfTime: 'global Time' | 'time for any question'
  quizQuestions: {
    mainQuestion: string
    choices: string[]
    correctAnswer: number
    time: number
    marks: number
  }[]
}

export const QuizCreatePage = () => {
  const navigate = useNavigate()
  const { quizId } = useParams()
  const isEditing = !!quizId

  const user = useSelector(selectCurrentUser)

  const [createQuiz, { isLoading: isCreating }] = useCreateQuizMutation()
  const [updateQuiz, { isLoading: isUpdating }] = useUpdateQuizMutation()
  const { data: branches } = useGetBranchsQuery()

  const [step, setStep] = useState(1)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      typeOfTime: 'global Time',
      quizQuestions: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'quizQuestions',
  })

  const onSubmit = async (data: QuizFormData) => {
    try {
      // Generate IDs for questions and filter empty choices
      const questionId = quizId || crypto.randomUUID()
      const cleanedData = {
        ...data,
        authorId: user?.id || '',
        quizQuestions: data.quizQuestions?.map(q => ({
          ...q,
          id: crypto.randomUUID(),
          quizId: questionId,
          choices: q.choices.filter(c => c && c.trim() !== '')
        }))
      }

      if (isEditing && quizId) {
        await updateQuiz({ id: quizId, data: cleanedData }).unwrap()
        toast.success('Quiz mis à jour avec succès')
      } else {
        await createQuiz(cleanedData).unwrap()
        toast.success('Quiz créé avec succès')
      }
      navigate('/quiz')
    } catch (err: any) {
      console.error(err)
      toast.error('Erreur lors de la sauvegarde du quiz')
    }
  }

  const onError = (errors: any) => {
    console.error("Erreurs de validation complètes:", JSON.stringify(errors, null, 2))
    
    // Fonction pour extraire le premier message d'erreur d'un objet d'erreurs imbriqué
    const extractFirstMessage = (errObj: any): string | null => {
      if (!errObj || typeof errObj !== 'object') return null
      if (errObj.message) return errObj.message
      
      const values = Object.values(errObj)
      for (const val of values) {
        if (Array.isArray(val)) {
          // Cas quizQuestions: tableau d'erreurs par question
          for (const item of val) {
            const msg = extractFirstMessage(item)
            if (msg) return msg
          }
        } else if (val && typeof val === 'object') {
          const msg = extractFirstMessage(val)
          if (msg) return msg
        }
      }
      return null
    }
    
    const message = extractFirstMessage(errors) || "Veuillez vérifier tous les champs du formulaire"
    toast.error(message)
  }

  const addQuestion = () => {
    append({
      mainQuestion: '',
      choices: ['', '', '', ''],
      correctAnswer: 0,
      time: 30,
      marks: 1,
    })
  }

  const timeTypeOptions = [
    { value: 'global Time', label: 'Temps global pour tout le quiz' },
    { value: 'time for any question', label: 'Temps par question' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/quiz')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {isEditing ? 'Modifier le quiz' : 'Créer un quiz'}
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-4">
        <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            1
          </div>
          <span>Informations</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            2
          </div>
          <span>Questions</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)}>
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Informations du quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nom du quiz</Label>
                <Input id="name" {...register('name')} error={errors.name?.message} />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...register('description')} error={errors.description?.message} />
              </div>
              <div>
                <Label>Branches</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {branches?.map((branch) => (
                    <label key={branch.id} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-accent">
                      <input type="checkbox" value={branch.id} {...register('branchId')} />
                      <span>{branch.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Date de début</Label>
                  <Input id="startDate" type="datetime-local" {...register('startDate')} error={errors.startDate?.message} />
                </div>
                <div>
                  <Label htmlFor="endDate">Date de fin</Label>
                  <Input id="endDate" type="datetime-local" {...register('endDate')} error={errors.endDate?.message} />
                </div>
              </div>
              <div>
                <Label htmlFor="typeOfTime">Type de temps</Label>
                <Select id="typeOfTime" options={timeTypeOptions} {...register('typeOfTime')} />
              </div>
              <div className="flex justify-end">
                <Button type="button" onClick={() => setStep(2)}>
                  Continuer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Questions</CardTitle>
                <Button type="button" onClick={addQuestion} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une question
                </Button>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Cliquez sur "Ajouter une question" pour commencer
                  </p>
                ) : (
                  <div className="space-y-6">
                    {fields.map((field, index) => (
                      <Card key={field.id}>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <Label>Question</Label>
                            <Input {...register(`quizQuestions.${index}.mainQuestion`)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Temps (secondes)</Label>
                              <Input type="number" {...register(`quizQuestions.${index}.time`, { valueAsNumber: true })} />
                            </div>
                            <div>
                              <Label>Points</Label>
                              <Input type="number" {...register(`quizQuestions.${index}.marks`, { valueAsNumber: true })} />
                            </div>
                          </div>
                          <div>
                            <div className="mb-2">
                              <Label>Choix</Label>
                              <p className="text-xs text-muted-foreground">
                                Remplissez les options de réponse et cochez le bouton radio rond à gauche pour indiquer la bonne réponse.
                              </p>
                            </div>
                            <div className="space-y-2">
                              {[0, 1, 2, 3].map((choiceIndex) => (
                                <div key={choiceIndex} className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    value={choiceIndex}
                                    {...register(`quizQuestions.${index}.correctAnswer`, { valueAsNumber: true })}
                                  />
                                  <Input
                                    placeholder={`Choix ${choiceIndex + 1}`}
                                    {...register(`quizQuestions.${index}.choices.${choiceIndex}`)}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button type="submit" isLoading={isCreating || isUpdating}>
                {isEditing ? 'Mettre à jour' : 'Créer le quiz'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
