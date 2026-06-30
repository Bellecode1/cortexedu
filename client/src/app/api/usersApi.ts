import { baseApi } from './baseApi'
import type { User, UserFormData, PaginatedResponse } from '@/types'

interface GetUsersParams {
  page?: number
  pageSize?: number
  gender?: string[]
  role?: string[]
}

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<PaginatedResponse<User>, GetUsersParams>({
      query: (params) => ({
        url: '/users',
        params: {
          page: params.page || 1,
          pageSize: params.pageSize || 5,
          gender: params.gender?.join(','),
          role: params.role?.join(','),
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    getStudents: builder.query<User[], void>({
      query: () => '/userStudents',
      providesTags: ['Student'],
    }),
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    createUser: builder.mutation<User, UserFormData>({
      query: (user) => ({
        url: '/user',
        method: 'POST',
        body: user,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, 'Student'],
    }),
    updateUser: builder.mutation<User, { id: string; data: Partial<UserFormData> }>({
      query: ({ id, data }) => ({
        url: `/updateUser/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
        'Profile',
      ],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/deleteUser/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }, 'Student'],
    }),
  }),
})

export const {
  useGetUsersQuery,
  useGetStudentsQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi
