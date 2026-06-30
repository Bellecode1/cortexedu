import { useState } from 'react'
import { useGetUsersQuery, useDeleteUserMutation } from '@app/api'
import { Card, CardContent, CardHeader } from '@components/ui/Card'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/Table'
import { Badge } from '@components/ui/Badge'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { UserForm } from '@components/users'
import type { User, UserRole } from '@/types'

const roleColors: Record<UserRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Student: 'secondary',
  Teacher: 'default',
  Parent: 'outline',
  Administrateur: 'destructive',
}

const roleLabels: Record<UserRole, string> = {
  Student: 'Étudiant',
  Teacher: 'Enseignant',
  Parent: 'Parent',
  Administrateur: 'Administrateur',
}

export const UsersPage = () => {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  const { data, isLoading, refetch } = useGetUsersQuery({ page, pageSize: 10 })
  const [deleteUser] = useDeleteUserMutation()

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteUser(id).unwrap()
        toast.success('Utilisateur supprimé avec succès')
        refetch()
      } catch {
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setSelectedUser(null)
    setIsFormOpen(true)
  }

  const handleFormSuccess = () => {
    refetch()
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedUser(null)
  }

  const filteredUsers = data?.data.filter((user) =>
    `${user.name} ${user.surname} ${user.mail}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les utilisateurs de la plateforme
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">
                          {user.name} {user.surname}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.telephone}
                        </div>
                      </TableCell>
                      <TableCell>{user.mail}</TableCell>
                      <TableCell>
                        <Badge variant={roleColors[user.role]}>
                          {roleLabels[user.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.sexe === 'Male' ? 'Masculin' : 'Féminin'}</TableCell>
                      <TableCell>
                        <Badge variant={user.verified ? 'default' : 'secondary'}>
                          {user.verified ? 'Vérifié' : 'En attente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Total: {data?.totalCount || 0} utilisateurs
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Précédent
                  </Button>
                  <span className="flex items-center px-3 py-1 text-sm border rounded-md">
                    Page {page}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data || page * 10 >= (data?.totalCount || 0)}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Form Modal */}
      <UserForm
        user={selectedUser}
        open={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
