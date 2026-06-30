import { baseApi } from './baseApi'
import type { Quiz, QuizFormData, QuizQuestion } from '@/types'

export const quizApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllQuizs: builder.query<Quiz[], void>({
      query: () => '/quizs',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Quiz' as const, id: id || '' })),
              { type: 'Quiz', id: 'LIST' },
            ]
          : [{ type: 'Quiz', id: 'LIST' }],
    }),
    getQuizsByBranch: builder.query<Quiz[], string>({
      query: (branchId) => `/quiz/${branchId}`,
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Quiz' as const, id })),
            { type: 'Quiz', id: 'LIST' },
          ]
          : [{ type: 'Quiz', id: 'LIST' }],
    }),
    getQuizById: builder.query<Quiz, string>({
      query: (id) => `/quiz/id/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Quiz', id }],
    }),
    getQuizsByAuthor: builder.query<Quiz[], string>({
      query: (authorId) => `/quiz/authorId/${authorId}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: 'Quiz' as const, id }))
          : [],
    }),
    getQuizsByStudent: builder.query<Quiz[], string>({
      query: (studentId) => `/quiz/student/${studentId}`,
      providesTags: [{ type: 'Quiz', id: 'LIST' }],
    }),
    createQuiz: builder.mutation<Quiz, QuizFormData>({
      query: (quiz) => ({
        url: '/quiz',
        method: 'POST',
        body: quiz,
      }),
      invalidatesTags: [{ type: 'Quiz', id: 'LIST' }],
    }),
    updateQuiz: builder.mutation<Quiz, { id: string; data: Partial<QuizFormData> }>({
      query: ({ id, data }) => ({
        url: `/updateQuiz/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Quiz', id },
        { type: 'Quiz', id: 'LIST' },
      ],
    }),
    deleteQuiz: builder.mutation<void, string>({
      query: (id) => ({
        url: `/deleteQuiz/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Quiz', id: 'LIST' }],
    }),
    addQuestions: builder.mutation<Quiz, { id: string; questions: QuizQuestion[] }>({
      query: ({ id, questions }) => ({
        url: `/addQuestions/${id}`,
        method: 'PUT',
        body: { quizQuestions: questions },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Quiz', id }],
    }),
  }),
})

export const {
  useGetAllQuizsQuery,
  useGetQuizsByBranchQuery,
  useGetQuizByIdQuery,
  useGetQuizsByAuthorQuery,
  useGetQuizsByStudentQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useAddQuestionsMutation,
} = quizApi
