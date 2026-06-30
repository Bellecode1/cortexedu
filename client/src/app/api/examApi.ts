import { baseApi } from './baseApi'
import type { Exam, ExamFormData } from '@/types'

export const examApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Exams ───
    getExams: builder.query<Exam[], void>({
      query: () => '/exams',
      providesTags: ['Exam'],
    }),
    getExamsByTeacher: builder.query<Exam[], string>({
      query: (teacherId) => `/exams/teacher/${teacherId}`,
      providesTags: ['Exam'],
    }),
    getExamsByBranch: builder.query<Exam[], string>({
      query: (branchId) => `/exams/branch/${branchId}`,
      providesTags: ['Exam'],
    }),
    createExam: builder.mutation<Exam, ExamFormData & { teacher_id: string }>({
      query: (exam) => ({
        url: '/exams',
        method: 'POST',
        body: exam,
      }),
      invalidatesTags: ['Exam'],
    }),
    /** Upload an exam with a file — sends multipart/form-data */
    createExamWithFile: builder.mutation<Exam, FormData>({
      query: (formData) => ({
        url: '/exams',
        method: 'POST',
        body: formData,
        // FormData sets its own Content-Type (multipart/form-data with boundary)
        formData: true,
      }),
      invalidatesTags: ['Exam'],
    }),
    deleteExam: builder.mutation<void, string>({
      query: (id) => ({
        url: `/exams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exam'],
    }),
  }),
})

export const {
  useGetExamsQuery,
  useGetExamsByTeacherQuery,
  useGetExamsByBranchQuery,
  useCreateExamMutation,
  useCreateExamWithFileMutation,
  useDeleteExamMutation,
} = examApi
