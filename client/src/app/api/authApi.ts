import { baseApi } from './baseApi'
import type { LoginCredentials, LoginResponse, ProfileResponse, User } from '@/types'
import type { RegisterFormData } from '@lib/validators'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getProfile: builder.query<ProfileResponse, void>({
      query: () => '/profile',
      providesTags: ['Profile'],
    }),
    getUserByEmailOrPhone: builder.query<User, { email: string; phone: string }>({
      query: ({ email, phone }) => `/user/mail/${email}/${phone}`,
    }),
    register: builder.mutation<User, RegisterFormData>({
      query: (userData) => ({
        url: '/user',
        method: 'POST',
        body: userData,
      }),
    }),
    forgotPassword: builder.mutation<{ success: boolean; message: string; devCode?: string }, { email: string }>({
      query: (data) => ({
        url: '/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),
    resetPassword: builder.mutation<{ success: boolean; message: string }, { email: string; code: string; newPassword: string }>({
      query: (data) => ({
        url: '/reset-password',
        method: 'POST',
        body: data,
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useGetProfileQuery,
  useGetUserByEmailOrPhoneQuery,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi
