import { baseApi } from './baseApi'
import type { Notification } from '@/types'

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], string>({
      query: (userId) => `/notifications/${userId}`,
      providesTags: ['Notification'],
    }),
    getUnreadCount: builder.query<{ count: number }, string>({
      query: (userId) => `/notifications/${userId}/unread-count`,
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<Notification, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/notifications/${userId}/read-all`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
})

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi
