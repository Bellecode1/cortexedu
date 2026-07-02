import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export { API_URL }

const baseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['User', 'Student', 'Quiz', 'Branch', 'Result', 'Profile', 'Exam', 'Submission', 'Notification', 'Stats'],
  endpoints: () => ({}),
})
