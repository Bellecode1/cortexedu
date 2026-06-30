import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

export const userSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  surname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  mail: z.string().email('Email invalide'),
  telephone: z.string().min(9, 'Le téléphone doit contenir au moins 9 chiffres'),
  role: z.enum(['Student', 'Parent', 'Teacher', 'Administrateur']),
  dob: z.string().min(1, 'La date de naissance est requise'),
  sexe: z.enum(['Male', 'Female']),
  adresse: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  brancnId: z.string().optional(),
  studentArrayId: z.array(z.string()).optional(),
  confirm_password: z.string().optional(),
})

export const quizQuestionSchema = z.object({
  mainQuestion: z.string().min(5, 'La question doit contenir au moins 5 caractères'),
  choices: z.array(z.string()).min(2).refine(
    (choices) => choices.filter(c => c && c.trim() !== '').length >= 2,
    { message: 'Remplissez au moins 2 choix' }
  ),
  correctAnswer: z.number().min(0, 'Sélectionnez la réponse correcte'),
  time: z.number().min(5, 'Le temps minimum est de 5 secondes').max(300, 'Le temps maximum est de 300 secondes'),
  marks: z.number().min(1, 'La note minimum est de 1').max(10, 'La note maximum est de 10'),
})

export const quizSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  branchId: z.array(z.string()).min(1, 'Sélectionnez au moins une branche'),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  typeOfTime: z.enum(['global Time', 'time for any question']),
  quizQuestions: z.array(quizQuestionSchema).optional(),
})



export const branchSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  surname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  mail: z.string().email('Email invalide'),
  telephone: z.string().min(9, 'Le téléphone doit contenir au moins 9 chiffres'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirm_password: z.string().min(1, 'Confirmez votre mot de passe'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm_password'],
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type UserFormData = z.infer<typeof userSchema>
export type QuizFormData = z.infer<typeof quizSchema>
export type QuizQuestionFormData = z.infer<typeof quizQuestionSchema>
export type BranchFormData = z.infer<typeof branchSchema>
