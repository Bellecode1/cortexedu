import { baseApi } from './baseApi'
import type { TeacherQuizStats, StudentPerformanceData } from '@/types'

export const statsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getQuizStats: builder.query<TeacherQuizStats, string>({
      query: (quizId) => `/stats/quiz/${quizId}`,
      providesTags: ['Stats'],
    }),
    getTeacherStats: builder.query<{ totalQuizzes: number; totalSubmissions: number; totalStudents: number; averageScore: number; scoreDistribution?: { range: string; count: number }[] }, string>({
      query: (teacherId) => `/stats/teacher/${teacherId}`,
      providesTags: ['Stats'],
    }),
    getStudentStats: builder.query<{ totalQuizzes: number; averageScore: number; bestScore: number; performance: StudentPerformanceData[] }, string>({
      query: (studentId) => `/stats/student/${studentId}`,
      providesTags: ['Stats'],
    }),
  }),
})

export const {
  useGetQuizStatsQuery,
  useGetTeacherStatsQuery,
  useGetStudentStatsQuery,
} = statsApi
