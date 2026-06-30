import { baseApi } from './baseApi'
import type { StudentQuizResult, Result, ResultFormData, QuizResult } from '@/types'

export const resultsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getResultsByUser: builder.query<StudentQuizResult[], string>({
      query: (userId) => `/results/${userId}`,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Result' as const, id })),
            { type: 'Result', id: 'LIST' },
          ]
          : [{ type: 'Result', id: 'LIST' }],
    }),
    getResultsByQuiz: builder.query<Result[], string>({
      query: (quizId) => `/results/quizId/${quizId}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: 'Result' as const, id }))
          : [],
    }),
    getResultsByQuizAndAuthor: builder.query<Result[], { quizId: string; authorId: string }>({
      query: ({ quizId, authorId }) => `/results/quizId/authorId/${quizId}/${authorId}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: 'Result' as const, id }))
          : [],
    }),
    getResultsByParent: builder.query<QuizResult[], string>({
      query: (parentId) => `/results/parentId/${parentId}`,
      providesTags: ['Result'],
    }),
    getResultByUserAndQuiz: builder.query<Result, { userId: string; quizId: string }>({
      query: ({ userId, quizId }) => `/results/${userId}/${quizId}`,
      providesTags: (_result, _error, { userId, quizId }) => [
        { type: 'Result', id: `${userId}-${quizId}` },
      ],
    }),
    /** Returns results for all quizzes by an author, with studentName enriched */
    getResultsByAuthor: builder.query<any[], string>({
      query: (authorId) => `/results/all/author/${authorId}`,
      providesTags: ['Result'],
    }),
    createResult: builder.mutation<Result, ResultFormData>({
      query: (result) => ({
        url: '/result',
        method: 'POST',
        body: result,
      }),
      invalidatesTags: [{ type: 'Result', id: 'LIST' }],
    }),
    /** Generate PV (Procès-Verbal) data for a specific quiz */
    getPvByQuiz: builder.query<any, { quizId: string; authorId: string }>({
      query: ({ quizId, authorId }) => `/pv/quiz/${quizId}/${authorId}`,
      providesTags: ['Result'],
    }),
    updateResult: builder.mutation<Result, { userId: string; quizId: string; data: Partial<ResultFormData> }>({
      query: ({ userId, quizId, data }) => ({
        url: `/result/${userId}/${quizId}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { userId, quizId }) => [
        { type: 'Result', id: 'LIST' },
        { type: 'Result', id: `${userId}-${quizId}` },
      ],
    }),
  }),
})

export const {
  useGetResultsByUserQuery,
  useGetResultsByQuizQuery,
  useGetResultsByQuizAndAuthorQuery,
  useGetResultsByParentQuery,
  useGetResultByUserAndQuizQuery,
  useGetResultsByAuthorQuery,
  useCreateResultMutation,
  useUpdateResultMutation,
  useGetPvByQuizQuery,
} = resultsApi
