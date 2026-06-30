import { baseApi } from './baseApi'
import type { Branch, BranchFormData } from '@/types'

export const branchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranchs: builder.query<Branch[], void>({
      query: () => '/branchs',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Branch' as const, id })),
              { type: 'Branch', id: 'LIST' },
            ]
          : [{ type: 'Branch', id: 'LIST' }],
    }),
    getBranchById: builder.query<Branch, string>({
      query: (id) => `/branchs/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Branch', id }],
    }),
    createBranch: builder.mutation<Branch, BranchFormData>({
      query: (branch) => ({
        url: '/branch',
        method: 'POST',
        body: branch,
      }),
      invalidatesTags: [{ type: 'Branch', id: 'LIST' }],
    }),
    updateBranch: builder.mutation<Branch, { id: string; data: Partial<BranchFormData> }>({
      query: ({ id, data }) => ({
        url: `/updatebranch/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Branch', id },
        { type: 'Branch', id: 'LIST' },
      ],
    }),
    deleteBranch: builder.mutation<void, string>({
      query: (id) => ({
        url: `/deleteBranch/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Branch', id: 'LIST' }],
    }),
  }),
})

export const {
  useGetBranchsQuery,
  useGetBranchByIdQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
} = branchApi
