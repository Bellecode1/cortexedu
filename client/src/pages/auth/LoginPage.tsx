import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { GlassCard } from '@components/ui/GlassCard'
import { Button } from '@components/ui/Button'
import { Input } from '@components/ui/Input'
import { Label } from '@components/ui/Label'
import { loginSchema, type LoginFormData } from '@lib/validators'
import { useLoginMutation } from '@app/api'
import { setCredentials } from '@features/auth'

export const LoginPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [login, { isLoading }] = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await login({
        email: data.email,
        password: data.password,
      }).unwrap()

      const profileRes = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${response.token}`
        }
      })

      if (!profileRes.ok) {
        throw new Error('Failed to fetch profile')
      }

      const profileData = await profileRes.json()
      const user = profileData.user

      dispatch(setCredentials({ user, token: response.token }))
      toast.success('Connexion réussie!')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Email ou mot de passe incorrect')
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
          <div className="h-12 w-12 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(0,229,255,0.1)]">
            <LogIn className="h-6 w-6 text-neon-cyan" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Connexion</h2>
          <p className="text-sm text-slate-400">
            Entrez vos identifiants pour accéder à votre compte
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              error={errors.email?.message}
              className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-neon-cyan/50 rounded-xl"
              {...register('email')}
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
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            Se connecter
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-neon-cyan hover:text-neon-cyan/80 transition-colors font-medium">
            Inscrivez-vous
          </Link>
        </p>
      </GlassCard>
    </motion.div>
  )
}
