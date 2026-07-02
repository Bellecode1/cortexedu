import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BrainCircuit, User, Mail, Lock, ArrowRight, Eye, EyeOff, X, CheckCircle2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { API_URL } from '@app/api/baseApi'
import { useLoginMutation, useRegisterMutation, useForgotPasswordMutation, useResetPasswordMutation } from '@app/api'
import { setCredentials } from '@features/auth'

/* ───────────────────────────────────────────
   Orbiting Node Component
   ─────────────────────────────────────────── */
const OrbitingNode = ({
  size,
  orbitSize,
  color,
  duration,
  direction = 1,
  delay = 0,
}: {
  size: number
  orbitSize: number
  color: string
  duration: number
  direction?: number
  delay?: number
}) => (
  <motion.div
    className="absolute top-1/2 left-1/2"
    style={{ width: 0, height: 0 }}
    initial={false}
    animate={{ rotate: 360 * direction }}
    transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
  >
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: orbitSize / 2 - size / 2,
        top: -orbitSize / 2 - size / 2,
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}44, 0 0 ${size * 4}px ${color}22`,
      }}
    />
  </motion.div>
)

/* ───────────────────────────────────────────
   Neural Core — right panel visual
   ─────────────────────────────────────────── */
const NeuralCore = () => (
  <motion.div
    className="flex-1 md:flex items-center justify-center hidden relative overflow-hidden bg-navy-900/80 border-l border-white/5"
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1, ease: 'easeOut' }}
  >
    {/* SVG grid pattern */}
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.15 }}
    >
      <defs>
        <pattern id="neural-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(124,92,255,0.15)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#neural-grid)" />
    </svg>

    {/* Neural core container */}
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Ring 1 — outermost, slowest */}
      <div
        className="absolute rounded-full border border-neon-cyan/20"
        style={{
          width: 256,
          height: 256,
          animation: 'spin-slow-20 20s linear infinite',
        }}
      />
      {/* Ring 2 — middle */}
      <div
        className="absolute rounded-full border border-neon-violet/20"
        style={{
          width: 192,
          height: 192,
          animation: 'spin-slow-15 15s linear infinite reverse',
        }}
      />
      {/* Ring 3 — innermost */}
      <div
        className="absolute rounded-full border border-white/10"
        style={{
          width: 128,
          height: 128,
          animation: 'spin-slow-10 10s linear infinite',
        }}
      />

      {/* Glowing center orb */}
      <div
        className="absolute rounded-full blur-2xl"
        style={{
          width: 80,
          height: 80,
          background: 'rgba(0, 229, 255, 0.25)',
          boxShadow: '0 0 60px rgba(0, 229, 255, 0.3)',
        }}
      />
      {/* Solid center icon */}
      <div
        className="relative rounded-full flex items-center justify-center"
        style={{
          width: 64,
          height: 64,
          background: 'rgba(0, 229, 255, 0.1)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          boxShadow: '0 0 30px rgba(0, 229, 255, 0.2)',
        }}
      >
        <BrainCircuit className="w-8 h-8 text-neon-cyan" />
      </div>

      {/* Orbiting nodes */}
      <OrbitingNode
        size={12}
        orbitSize={120}
        color="#7C5CFF"
        duration={18}
        direction={1}
      />
      <OrbitingNode
        size={8}
        orbitSize={100}
        color="#00E5FF"
        duration={14}
        direction={-1}
        delay={2}
      />
    </div>

    {/* Bottom caption */}
    <div className="absolute bottom-8 left-0 right-0 text-center px-8">
      <h3 className="text-white font-bold text-lg mb-1">
        Moteur d'apprentissage adaptatif
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed">
        Une expérience d'apprentissage personnalisée propulsée par l'intelligence artificielle, en temps réel.
      </p>
    </div>
  </motion.div>
)

/* ───────────────────────────────────────────
   Main AuthPage Component
   ─────────────────────────────────────────── */
export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [loginMutation, { isLoading: isLoggingIn }] = useLoginMutation()
  const [registerMutation, { isLoading: isRegistering }] = useRegisterMutation()
  const [forgotPassword, { isLoading: isSendingCode }] = useForgotPasswordMutation()
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation()

  // Forgot password modal state
  const [showForgotPwd, setShowForgotPwd] = useState(false)
  const [fpStep, setFpStep] = useState<'email' | 'reset'>('email')
  const [fpEmail, setFpEmail] = useState('')
  const [fpCode, setFpCode] = useState('')
  const [fpNewPwd, setFpNewPwd] = useState('')
  const [fpConfirmPwd, setFpConfirmPwd] = useState('')
  const [fpError, setFpError] = useState('')
  const [fpSuccess, setFpSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<{
    fullName?: string
    email: string
    password: string
    confirmPassword?: string
  }>()

  const isLoading = isLoggingIn || isRegistering

  const openForgotPassword = useCallback(() => {
    setShowForgotPwd(true)
    setFpStep('email')
    setFpEmail('')
    setFpCode('')
    setFpNewPwd('')
    setFpConfirmPwd('')
    setFpError('')
    setFpSuccess('')
  }, [])

  const handleSendCode = useCallback(async () => {
    if (!fpEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fpEmail)) {
      setFpError('Veuillez entrer un email valide')
      return
    }
    setFpError('')
    try {
      const res = await forgotPassword({ email: fpEmail }).unwrap()
      setFpSuccess(res.message || 'Code envoyé !')
      setFpStep('reset')
      // En mode dev, pré-remplir le code
      if (res.devCode) {
        setFpCode(res.devCode)
        toast.info(`Code de test : ${res.devCode} (mode développement)`)
      }
    } catch (err: any) {
      setFpError(err?.data?.error || "Erreur lors de l'envoi du code")
    }
  }, [fpEmail, forgotPassword])

  const handleResetPassword = useCallback(async () => {
    setFpError('')
    if (!fpCode || fpCode.length < 4) {
      setFpError('Veuillez entrer le code de réinitialisation')
      return
    }
    if (fpNewPwd.length < 6) {
      setFpError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (fpNewPwd !== fpConfirmPwd) {
      setFpError('Les mots de passe ne correspondent pas')
      return
    }
    try {
      await resetPassword({ email: fpEmail, code: fpCode, newPassword: fpNewPwd }).unwrap()
      setFpSuccess('Mot de passe réinitialisé !')
      toast.success('Mot de passe réinitialisé avec succès. Connectez-vous maintenant.')
      setShowForgotPwd(false)
    } catch (err: any) {
      setFpError(err?.data?.error || 'Erreur lors de la réinitialisation')
    }
  }, [fpEmail, fpCode, fpNewPwd, fpConfirmPwd, resetPassword])

  // Switch mode
  const switchMode = useCallback(
    (login: boolean) => {
      setIsLogin(login)
      reset()
      setShowPassword(false)
    },
    [reset]
  )

  // Submit handler
  const onSubmit = useCallback(
    async (data: { fullName?: string; email: string; password: string; confirmPassword?: string }) => {
      if (isLogin) {
        // ── LOGIN ──
        try {
          const response = await loginMutation({
            email: data.email,
            password: data.password,
          }).unwrap()

          const profileRes = await fetch(`${API_URL}/profile`, {
            headers: { Authorization: `Bearer ${response.token}` },
          })

          if (!profileRes.ok) {
            throw new Error('Failed to fetch profile')
          }

          const profileData = await profileRes.json()
          const user = profileData.user

          dispatch(setCredentials({ user, token: response.token }))
          toast.success('Connexion réussie !')
          navigate('/dashboard')
        } catch (error: any) {
          console.error('Login error:', error)
          if (error?.status === 401) {
            toast.error('Email ou mot de passe incorrect')
          } else {
            toast.error('Erreur de connexion. Veuillez réessayer.')
          }
        }
      } else {
        // ── REGISTER ──
        // Validate
        if (!data.fullName || data.fullName.trim().length < 3) {
          toast.error('Veuillez entrer votre nom complet')
          return
        }
        if (!data.confirmPassword || data.password !== data.confirmPassword) {
          toast.error('Les mots de passe ne correspondent pas')
          return
        }

        // Split fullName into name / surname
        const nameParts = data.fullName.trim().split(/\s+/)
        const name = nameParts[0] || ''
        const surname = nameParts.slice(1).join(' ') || nameParts[0] || ''

        try {
          await registerMutation({
            name,
            surname,
            mail: data.email,
            telephone: '',
            password: data.password,
            confirm_password: data.confirmPassword,
          }).unwrap()

          toast.success('Inscription réussie ! Connectez-vous maintenant.')
          switchMode(true)
        } catch (error: any) {
          if (error?.status === 409) {
            toast.error('Cet email est déjà utilisé')
          } else {
            toast.error("Erreur lors de l'inscription")
          }
        }
      }
    },
    [isLogin, loginMutation, registerMutation, dispatch, navigate, switchMode]
  )

  return (
    <>
      {/* ═══ LEFT HALF — Form ═══ */}
      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
        {/* Brand row */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-neon-cyan" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-white">Cortex</span>
            <span className="text-neon-cyan">Edu</span>
          </span>
        </div>

        {/* Heading block */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login-heading' : 'register-heading'}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="mb-6"
          >
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
              {isLogin ? 'Bon retour' : 'Créer un compte'}
            </h1>
            <p className="text-slate-400 text-sm">
              {isLogin
                ? 'Connectez-vous pour accéder à votre espace'
                : 'Rejoignez la plateforme d\'apprentissage adaptatif'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-navy-900/50 p-1 mb-8 w-fit">
          <button
            type="button"
            onClick={() => switchMode(true)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isLogin
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => switchMode(false)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              !isLogin
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name — signup only */}
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="fullName-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <label
                  htmlFor="fullName"
                  className="block text-sm text-slate-300 mb-1.5"
                >
                  Nom complet
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    autoComplete="name"
                    {...register('fullName', {
                      required: !isLogin && 'Le nom est requis',
                      minLength: { value: 2, message: 'Minimum 2 caractères' },
                    })}
                    className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all duration-200"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm text-slate-300 mb-1.5"
            >
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="exemple@email.com"
                autoComplete="email"
                {...register('email', {
                  required: "L'email est requis",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email invalide',
                  },
                })}
                className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all duration-200"
              />
            </div>
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-sm text-slate-300"
              >
                Mot de passe
              </label>                  {isLogin && (
                    <button
                      type="button"
                      className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                      onClick={openForgotPassword}
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                {...register('password', {
                  required: 'Le mot de passe est requis',
                  ...(!isLogin && { minLength: { value: 6, message: 'Minimum 6 caractères' } }),
                })}
                className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password — signup only */}
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="confirmPassword-field"
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm text-slate-300 mb-1.5"
                >
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    {...register('confirmPassword', {
                      required: !isLogin && 'Confirmez votre mot de passe',
                      validate: (val) =>
                        !isLogin && watch('password') !== val
                          ? 'Les mots de passe ne correspondent pas'
                          : true,
                    })}
                    className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all duration-200"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 rounded-xl py-3 px-6 font-medium flex items-center justify-center gap-2 hover:bg-neon-cyan/20 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
            ) : (
              <>
                <span>{isLogin ? 'Démarrer la session' : 'Créer mon compte'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* ═══ RIGHT HALF — Neural Core ═══ */}
      <NeuralCore />

      {/* ════════════════════════════════════════
         FORGOT PASSWORD MODAL
         ════════════════════════════════════════ */}
      <AnimatePresence>
        {showForgotPwd && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowForgotPwd(false)}
            />

            {/* Modal */}
            <motion.div
              className="relative w-full max-w-md bg-navy-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {fpStep === 'email' ? 'Mot de passe oublié' : 'Nouveau mot de passe'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {fpStep === 'email'
                        ? 'Recevez un code de réinitialisation'
                        : 'Entrez le code reçu et votre nouveau mot de passe'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPwd(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 pt-4">
                {/* Success message */}
                {fpSuccess && fpStep === 'email' && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-sm text-emerald-300">{fpSuccess}</p>
                  </div>
                )}

                {/* Error message */}
                {fpError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                    <p className="text-sm text-red-400">{fpError}</p>
                  </div>
                )}

                {fpStep === 'email' ? (
                  /* Step 1: Enter email */
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="fp-email" className="block text-sm text-slate-300 mb-1.5">
                        Adresse e-mail
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input
                          id="fp-email"
                          type="email"
                          value={fpEmail}
                          onChange={(e) => setFpEmail(e.target.value)}
                          placeholder="exemple@email.com"
                          autoFocus
                          className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isSendingCode}
                      onClick={handleSendCode}
                      className="w-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-neon-cyan/20 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSendingCode ? (
                        <div className="w-5 h-5 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
                      ) : (
                        'Envoyer le code'
                      )}
                    </button>
                  </div>
                ) : (
                  /* Step 2: Enter code + new password */
                  <div className="space-y-4">
                    {/* Pre-filled email display */}
                    <div className="flex items-center gap-2 bg-navy-900/30 border border-white/5 rounded-xl px-4 py-2.5">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-300">{fpEmail}</span>
                    </div>

                    <div>
                      <label htmlFor="fp-code" className="block text-sm text-slate-300 mb-1.5">
                        Code de réinitialisation
                      </label>
                      <input
                        id="fp-code"
                        type="text"
                        value={fpCode}
                        onChange={(e) => setFpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        autoFocus
                        className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 px-4 text-center text-2xl font-bold tracking-[0.3em] text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label htmlFor="fp-new-pwd" className="block text-sm text-slate-300 mb-1.5">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input
                          id="fp-new-pwd"
                          type="password"
                          value={fpNewPwd}
                          onChange={(e) => setFpNewPwd(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="fp-confirm-pwd" className="block text-sm text-slate-300 mb-1.5">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                        <input
                          id="fp-confirm-pwd"
                          type="password"
                          value={fpConfirmPwd}
                          onChange={(e) => setFpConfirmPwd(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-navy-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/50 transition-all duration-200"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={handleResetPassword}
                      className="w-full bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-neon-cyan/20 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResetting ? (
                        <div className="w-5 h-5 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
                      ) : (
                        'Réinitialiser le mot de passe'
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setFpStep('email'); setFpError(''); setFpSuccess('') }}
                      className="w-full text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      ← Retour
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS keyframes for ring rotations — unique names to avoid Tailwind conflict */}
      <style>{`
        @keyframes spin-slow-20 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-15 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-10 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
