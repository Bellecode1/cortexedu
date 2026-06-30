import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Edit, GitBranch } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Label } from '@components/ui/Label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/Table'
import { Dialog } from '@components/ui/Dialog'
import {
  useGetBranchsQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} from '@app/api'
import { branchSchema, type BranchFormData } from '@lib/validators'
import { formatDate } from '@lib/utils'
import type { Branch } from '@/types'

export const BranchesPage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const { data: branches, isLoading } = useGetBranchsQuery()
  const [createBranch, { isLoading: isCreatingBranch }] = useCreateBranchMutation()
  const [updateBranch, { isLoading: isUpdatingBranch }] = useUpdateBranchMutation()
  const [deleteBranch] = useDeleteBranchMutation()
  const isEditing = !!selectedBranch
  const isLoadingSubmit = isCreatingBranch || isUpdatingBranch

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
  })

  // Mettre à jour le formulaire quand selectedBranch change
  useEffect(() => {
    if (selectedBranch) {
      reset({
        name: selectedBranch.name,
        description: selectedBranch.description || '',
      })
    } else {
      reset({
        name: '',
        description: '',
      })
    }
  }, [selectedBranch, reset])

  const onSubmit = async (data: BranchFormData) => {
    try {
      if (isEditing && selectedBranch) {
        await updateBranch({
          id: selectedBranch.id,
          data: {
            name: data.name,
            description: data.description,
          }
        }).unwrap()
        toast.success('Branche mise à jour avec succès')
      } else {
        await createBranch(data).unwrap()
        toast.success('Branche créée avec succès')
      }
      setIsFormOpen(false)
      setSelectedBranch(null)
      reset()
    } catch {
      toast.error(isEditing ? 'Erreur lors de la mise à jour' : 'Erreur lors de la création')
    }
  }

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setSelectedBranch(null)
    setIsFormOpen(true)
  }

  const handleClose = () => {
    setIsFormOpen(false)
    setSelectedBranch(null)
    reset()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette branche ?')) {
      try {
        await deleteBranch(id).unwrap()
        toast.success('Branche supprimée')
      } catch {
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground">
            Gérez les branches/filières de la plateforme
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle branche
        </Button>
      </div>

      {/* Branches List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Liste des branches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : branches && branches.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow key={branch.id}>
                    <TableCell className="font-medium">{branch.name}</TableCell>
                    <TableCell>{branch.description}</TableCell>
                    <TableCell>{formatDate(branch.create_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(branch)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(branch.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucune branche créée
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Dialog
        open={isFormOpen}
        onClose={handleClose}
        title={isEditing ? 'Modifier la branche' : 'Nouvelle branche'}
        description={isEditing ? 'Modifiez les informations de la branche' : 'Créez une nouvelle branche'}
        className="max-w-lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="Nom de la branche"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register('description')}
              error={errors.description?.message}
              placeholder="Description de la branche"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isLoadingSubmit}>
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
