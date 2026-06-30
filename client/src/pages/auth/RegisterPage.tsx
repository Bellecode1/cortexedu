import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { GlassCard } from '@components/ui/GlassCard'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Label } from '@components/ui/Label'
import { registerSchema, type RegisterFormData } from '@lib/validators'
import { useRegisterMutation } from '@app/api'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const [registerUser, { isLoading }] = useRegisterMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data).unwrap()
      toast.success('Inscription réussie ! Connectez-vous maintenant.')
      navigate('/login')
    } catch (error: any) {
      if (error?.status === 409) {
        toast.error('Cet email est déjà utilisé')
      } else {
        toast.error("Erreur lors de l'inscription")
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <GlassCard className="w-full p-8">
        <div className="text-center space-y-2 mb-6">
          <div className="h-12 w-12 rounded-xl bg-neon-violet/10 border border-neon-violet/30 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <UserPlus className="h-6 w-6 text-neon-violet" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Inscription</h2>
          <p className="text-sm text-slate-400">
            Créez votre compte pour accéder à la plateforme
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300 text-sm">Nom</Label>
              <Input
                id="name"
                placeholder="Votre nom"
                error={errors.name?.message}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-neon-cyan/50 rounded-xl"
                {...register('name')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname" className="text-slate-300 text-sm">Prénom</Label>
              <Input
                id="surname"
                placeholder="Votre prénom"
                error={errors.surname?.message}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-neon-cyan/50 rounded-xl"
                {...register('surname')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mail" className="text-slate-300 text-sm">Email</Label>
            <Input
              id="mail"
              type="email"
              placeholder="exemple@email.com"
              error={errors.mail?.message}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-neon-cyan/50 rounded-xl"
              {...register('mail')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone" className="text-slate-300 text-sm">Téléphone</Label>
            <Input
              id="telephone"
              type="tel"
              placeholder="+221 77 123 45 67"
              error={errors.telephone?.message}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-neon-cyan/50 rounded-xl"
              {...register('telephone')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300 text-sm">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-neon-cyan/50 rounded-xl"
              {...register('password')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_password" className="text-slate-300 text-sm">Confirmer le mot de passe</Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="••••••••"
              error={errors.confirm_password?.message}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-neon-cyan/50 rounded-xl"
              {...register('confirm_password')}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            Créer mon compte
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-neon-cyan hover:text-neon-cyan/80 transition-colors font-medium">
            Connectez-vous
          </Link>
        </p>
      </GlassCard>
    </motion.div>
  )
}
