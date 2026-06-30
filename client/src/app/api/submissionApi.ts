import { baseApi } from './baseApi'
import type { Submission, GradeFormData } from '@/types'

export const submissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSubmissionsByExam: builder.query<Submission[], string>({
      query: (examId) => `/submissions/exam/${examId}`,
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: 'Submission' as const, id }))
          : ['Submission'],
    }),
    getSubmissionsByStudent: builder.query<Submission[], string>({
      query: (studentId) => `/submissions/student/${studentId}`,
      providesTags: ['Submission'],
    }),
    getSubmissionsByTeacher: builder.query<Submission[], string>({
      query: (teacherId) => `/submissions/teacher/${teacherId}`,
      providesTags: ['Submission'],
    }),
    getSubmissionsByParent: builder.query<Submission[], string>({
      query: (parentId) => `/submissions/parent/${parentId}`,
      providesTags: ['Submission'],
    }),
    createSubmission: builder.mutation<Submission, { exam_id: string; student_id: string; file_path?: string }>({
      query: (submission) => ({
        url: '/submissions',
        method: 'POST',
        body: submission,
      }),
      invalidatesTags: ['Submission'],
    }),
    /** Submit a student copy with a file — sends multipart/form-data */
    createSubmissionWithFile: builder.mutation<Submission, FormData>({
      query: (formData) => ({
        url: '/submissions',
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Submission'],
    }),
    gradeSubmission: builder.mutation<Submission, { id: string; data: GradeFormData & { graded_by: string } }>({
      query: ({ id, data }) => ({
        url: `/submissions/${id}/grade`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Submission', id }],
    }),
  }),
})

export const {
  useGetSubmissionsByExamQuery,
  useGetSubmissionsByStudentQuery,
  useGetSubmissionsByTeacherQuery,
  useGetSubmissionsByParentQuery,
  useCreateSubmissionMutation,
  useCreateSubmissionWithFileMutation,
  useGradeSubmissionMutation,
} = submissionApi
