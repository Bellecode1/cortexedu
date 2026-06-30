import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, selectUserRole } from '@features/auth'
import type { UserRole } from '@/types'

// Layouts
import { MainLayout } from '@components/layout/MainLayout'
import { AuthLayout } from '@components/layout/AuthLayout'

// Pages
import { AuthPage } from '@pages/auth/AuthPage'
import { DashboardPage } from '@pages/dashboard/DashboardPage'
import { QuizListPage } from '@pages/quiz/QuizListPage'
import { QuizTakePage } from '@pages/quiz/QuizTakePage'
import { QuizCreatePage } from '@pages/quiz/QuizCreatePage'
import { PvPage } from '@pages/quiz/PvPage'
import { ResultsPage } from '@pages/results/ResultsPage'
import { UsersPage } from '@pages/admin/UsersPage'
import { BranchesPage } from '@pages/admin/BranchesPage'
import { ExamListPage } from '@pages/exam/ExamListPage'
import { ExamUploadPage } from '@pages/exam/ExamUploadPage'
import { ExamSubmitPage } from '@pages/exam/ExamSubmitPage'
import { GradeSubmissionsPage } from '@pages/exam/GradeSubmissionsPage'
import { NotFoundPage } from '@pages/NotFoundPage'

// Route guards
interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const userRole = useSelector(selectUserRole)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: 'login',
        element: <AuthPage />,
      },
      {
        path: 'register',
        element: <AuthPage />,
      },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'results',
        element: <ResultsPage />,
      },
      // Redirect old paths to unified results page
      {
        path: 'quiz/results',
        element: <Navigate to="/results" replace />,
      },
      {
        path: 'examinations/results',
        element: <Navigate to="/results" replace />,
      },
      {
        path: 'quiz',
            children: [
              {
                index: true,
                element: <QuizListPage />,
              },
              {
                path: 'take/:quizId',
                element: (
                  <ProtectedRoute allowedRoles={['Student']}>
                    <QuizTakePage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'create',
                element: (
                  <ProtectedRoute allowedRoles={['Teacher', 'Administrateur']}>
                    <QuizCreatePage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'edit/:quizId',
                element: (
                  <ProtectedRoute allowedRoles={['Teacher', 'Administrateur']}>
                    <QuizCreatePage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'pv/:quizId',
                element: (
                  <ProtectedRoute allowedRoles={['Teacher', 'Administrateur']}>
                    <PvPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
          {
            path: 'examinations',
            children: [
              {
                index: true,
                element: <ExamListPage />,
              },
              {
                path: 'create',
                element: (
                  <ProtectedRoute allowedRoles={['Teacher', 'Administrateur']}>
                    <ExamUploadPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'submit/:examId',
                element: (
                  <ProtectedRoute allowedRoles={['Student']}>
                    <ExamSubmitPage />
                  </ProtectedRoute>
                ),
              },
              {
                path: 'submissions/:examId',
                element: (
                  <ProtectedRoute allowedRoles={['Teacher', 'Administrateur']}>
                    <GradeSubmissionsPage />
                  </ProtectedRoute>
                ),
              },
            ],
          },
      {
        path: 'admin',
        children: [
          {
            path: 'users',
            element: (
              <ProtectedRoute allowedRoles={['Administrateur']}>
                <UsersPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'branches',
            element: (
              <ProtectedRoute allowedRoles={['Administrateur']}>
                <BranchesPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export const AppRouter = () => {
  return <RouterProvider router={router} />
}
