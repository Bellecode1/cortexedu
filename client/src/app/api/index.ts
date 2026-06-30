// API slices
export { baseApi } from './baseApi'
export { authApi } from './authApi'
export { usersApi } from './usersApi'
export { quizApi } from './quizApi'
export { branchApi } from './branchApi'
export { resultsApi } from './resultsApi'
export { examApi } from './examApi'
export { submissionApi } from './submissionApi'
export { notificationApi } from './notificationApi'
export { statsApi } from './statsApi'

// Auth hooks
export {
  useLoginMutation,
  useGetProfileQuery,
  useGetUserByEmailOrPhoneQuery,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from './authApi'

// Users hooks
export {
  useGetUsersQuery,
  useGetStudentsQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from './usersApi'

// Quiz hooks
export {
  useGetAllQuizsQuery,
  useGetQuizsByBranchQuery,
  useGetQuizByIdQuery,
  useGetQuizsByAuthorQuery,
  useGetQuizsByStudentQuery,
  useCreateQuizMutation,
  useUpdateQuizMutation,
  useDeleteQuizMutation,
  useAddQuestionsMutation,
} from './quizApi'

// Branch hooks
export {
  useGetBranchsQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} from './branchApi'

// Results hooks
export {
  useGetResultsByUserQuery,
  useGetResultsByQuizQuery,
  useGetResultsByQuizAndAuthorQuery,
  useGetResultsByParentQuery,
  useGetResultByUserAndQuizQuery,
  useGetResultsByAuthorQuery,
  useCreateResultMutation,
  useUpdateResultMutation,
  useGetPvByQuizQuery,
} from './resultsApi'

// Exam hooks
export {
  useGetExamsQuery,
  useGetExamsByTeacherQuery,
  useGetExamsByBranchQuery,
  useCreateExamMutation,
  useCreateExamWithFileMutation,
  useDeleteExamMutation,
} from './examApi'

// Submission hooks
export {
  useGetSubmissionsByExamQuery,
  useGetSubmissionsByStudentQuery,
  useGetSubmissionsByTeacherQuery,
  useGetSubmissionsByParentQuery,
  useCreateSubmissionMutation,
  useCreateSubmissionWithFileMutation,
  useGradeSubmissionMutation,
} from './submissionApi'

// Notification hooks
export {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './notificationApi'

// Stats hooks
export {
  useGetQuizStatsQuery,
  useGetTeacherStatsQuery,
  useGetStudentStatsQuery,
} from './statsApi'
