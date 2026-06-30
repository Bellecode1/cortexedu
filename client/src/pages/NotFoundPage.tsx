import { useNavigate } from 'react-router-dom'
import { Button } from '@components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/Card'
import { ArrowLeft, FileQuestion } from 'lucide-react'

export const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <FileQuestion className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle className="text-4xl">404</CardTitle>
          <CardDescription className="text-lg">
            Page non trouvée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
