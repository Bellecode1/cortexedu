import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Label } from '@components/ui/Label'
import { Select } from '@components/ui/Select'
import { Dialog } from '@components/ui/Dialog'
import { userSchema, type UserFormData } from '@lib/validators'
import { useCreateUserMutation, useUpdateUserMutation } from '@app/api'
import type { User } from '@/types'

interface UserFormProps {
  user?: User | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const roleOptions = [
  { value: 'Student', label: 'Étudiant' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Teacher', label: 'Enseignant' },
  { value: 'Administrateur', label: 'Administrateur' },
]

const genderOptions = [
  { value: 'Male', label: 'Masculin' },
  { value: 'Female', label: 'Féminin' },
]

export const UserForm = ({ user, open, onClose, onSuccess }: UserFormProps) => {
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const isLoading = isCreating || isUpdating
  const isEditing = !!user

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: user ? {
      name: user.name,
      surname: user.surname,
      mail: user.mail,
      telephone: user.telephone,
      role: user.role,
      dob: user.dob,
      sexe: user.sexe,
      adresse: user.adresse,
      brancnId: user.brancnId,
      studentArrayId: user.studentArrayId,
    } : {
      role: 'Student',
      sexe: 'Male',
      studentArrayId: [],
    }
  })

  const selectedRole = watch('role')

  // Mettre à jour les valeurs du formulaire quand user change
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        surname: user.surname,
        mail: user.mail,
        telephone: user.telephone,
        role: user.role,
        dob: user.dob,
        sexe: user.sexe,
        adresse: user.adresse,
        brancnId: user.brancnId,
        studentArrayId: user.studentArrayId,
      })
    } else {
      reset({
        role: 'Student',
        sexe: 'Male',
        studentArrayId: [],
      })
    }
  }, [user, reset])

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && user) {
        await updateUser({
          id: user.id,
          data: {
            name: data.name,
            surname: data.surname,
            mail: data.mail,
            telephone: data.telephone,
            role: data.role,
            dob: data.dob,
            sexe: data.sexe,
            adresse: data.adresse,
            brancnId: data.brancnId,
            studentArrayId: data.studentArrayId,
          }
        }).unwrap()
        toast.success('Utilisateur mis à jour avec succès')
      } else {
        await createUser({
          name: data.name,
          surname: data.surname,
          mail: data.mail,
          telephone: data.telephone,
          role: data.role,
          dob: data.dob,
          sexe: data.sexe,
          adresse: data.adresse,
          brancnId: data.brancnId,
          studentArrayId: data.studentArrayId,
        }).unwrap()
        toast.success('Utilisateur créé avec succès')
      }
      reset()
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Erreur lors de la sauvegarde de l\'utilisateur')
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEditing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
      description={isEditing ? 'Modifiez les informations de l\'utilisateur' : 'Créez un nouvel utilisateur'}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Nom */}
          <div>
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Nom"
            />
          </div>

          {/* Prénom */}
          <div>
            <Label htmlFor="surname">Prénom</Label>
            <Input
              id="surname"
              {...register('surname')}
              error={errors.surname?.message}
              placeholder="Prénom"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="mail">Email</Label>
            <Input
              id="mail"
              type="email"
              {...register('mail')}
              error={errors.mail?.message}
              placeholder="email@example.com"
            />
          </div>

          {/* Téléphone */}
          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              {...register('telephone')}
              error={errors.telephone?.message}
              placeholder="6XX XXX XXX"
            />
          </div>

          {/* Rôle */}
          <div>
            <Label htmlFor="role">Rôle</Label>
            <Select
              id="role"
              {...register('role')}
              error={errors.role?.message}
              options={roleOptions}
            />
          </div>

          {/* Genre */}
          <div>
            <Label htmlFor="sexe">Genre</Label>
            <Select
              id="sexe"
              {...register('sexe')}
              error={errors.sexe?.message}
              options={genderOptions}
            />
          </div>

          {/* Date de naissance */}
          <div>
            <Label htmlFor="dob">Date de naissance</Label>
            <Input
              id="dob"
              type="date"
              {...register('dob')}
              error={errors.dob?.message}
            />
          </div>

          {/* Branche (pour étudiants) */}
          {selectedRole === 'Student' && (
            <div>
              <Label htmlFor="brancnId">ID Branche</Label>
              <Input
                id="brancnId"
                {...register('brancnId')}
                error={errors.brancnId?.message}
                placeholder="ID de la branche"
              />
            </div>
          )}
        </div>

        {/* Adresse */}
        <div>
          <Label htmlFor="adresse">Adresse</Label>
          <Input
            id="adresse"
            {...register('adresse')}
            error={errors.adresse?.message}
            placeholder="Adresse complète"
          />
        </div>

        {/* Boutons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {isEditing ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
