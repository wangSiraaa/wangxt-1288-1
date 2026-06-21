import request from './request';
import {
  LoginData,
  User,
  PageData,
  Area,
  Toilet,
  Schedule,
  CheckIn,
  SupplyOrder,
  RepairOrder,
  Complaint,
  ComplaintReview,
  Alert
} from '@/types';

export const authApi = {
  login: (data: { username: string; password: string }) =>
    request.post<any, LoginData>('/auth/login', data),
  logout: () => request.post('/auth/logout')
};

export const userApi = {
  list: (params?: any) => request.get<any, PageData<User>>('/users', { params }),
  detail: (id: number) => request.get<any, User>(`/users/${id}`),
  create: (data: Partial<User>) => request.post('/users', data),
  update: (id: number, data: Partial<User>) => request.put(`/users/${id}`, data),
  delete: (id: number) => request.delete(`/users/${id}`),
  cleaners: () => request.get<any, User[]>('/users/list/cleaners')
};

export const areaApi = {
  list: () => request.get<any, Area[]>('/areas'),
  detail: (id: number) => request.get<any, Area>(`/areas/${id}`),
  create: (data: Partial<Area>) => request.post('/areas', data),
  update: (id: number, data: Partial<Area>) => request.put(`/areas/${id}`, data),
  delete: (id: number) => request.delete(`/areas/${id}`)
};

export const toiletApi = {
  list: (params?: any) => request.get<any, PageData<Toilet>>('/toilets', { params }),
  stats: () => request.get<any, any>('/toilets/stats'),
  detail: (id: number) => request.get<any, Toilet>(`/toilets/${id}`),
  create: (data: Partial<Toilet>) => request.post('/toilets', data),
  update: (id: number, data: Partial<Toilet>) => request.put(`/toilets/${id}`, data),
  delete: (id: number) => request.delete(`/toilets/${id}`),
  updateStock: (id: number, data: any) => request.put(`/toilets/${id}/stock`, data)
};

export const scheduleApi = {
  list: (params?: any) => request.get<any, PageData<Schedule>>('/schedules', { params }),
  detail: (id: number) => request.get<any, Schedule>(`/schedules/${id}`),
  create: (data: Partial<Schedule>) => request.post('/schedules', data),
  batchCreate: (data: { schedules: Partial<Schedule>[] }) => request.post('/schedules/batch', data),
  update: (id: number, data: Partial<Schedule>) => request.put(`/schedules/${id}`, data),
  delete: (id: number) => request.delete(`/schedules/${id}`)
};

export const checkInApi = {
  list: (params?: any) => request.get<any, PageData<CheckIn>>('/check-ins', { params }),
  detail: (id: number) => request.get<any, CheckIn>(`/check-ins/${id}`),
  create: (data: Partial<CheckIn>) => request.post('/check-ins', data)
};

export const supplyApi = {
  list: (params?: any) => request.get<any, PageData<SupplyOrder>>('/supplies', { params }),
  stats: () => request.get<any, any>('/supplies/stats'),
  detail: (id: number) => request.get<any, SupplyOrder>(`/supplies/${id}`),
  create: (data: Partial<SupplyOrder>) => request.post('/supplies', data),
  update: (id: number, data: Partial<SupplyOrder>) => request.put(`/supplies/${id}`, data),
  assign: (id: number, data: { assigned_to: number }) => request.post(`/supplies/${id}/assign`, data),
  complete: (id: number) => request.post(`/supplies/${id}/complete`),
  delete: (id: number) => request.delete(`/supplies/${id}`),
  checkStock: () => request.post('/supplies/check-stock')
};

export const repairApi = {
  list: (params?: any) => request.get<any, PageData<RepairOrder>>('/repairs', { params }),
  stats: () => request.get<any, any>('/repairs/stats'),
  detail: (id: number) => request.get<any, RepairOrder>(`/repairs/${id}`),
  create: (data: Partial<RepairOrder>) => request.post('/repairs', data),
  update: (id: number, data: Partial<RepairOrder>) => request.put(`/repairs/${id}`, data),
  assign: (id: number, data: { assigned_to: number }) => request.post(`/repairs/${id}/assign`, data),
  start: (id: number) => request.post(`/repairs/${id}/start`),
  complete: (id: number, data?: { repair_result: string }) => request.post(`/repairs/${id}/complete`, data),
  delete: (id: number) => request.delete(`/repairs/${id}`)
};

export const complaintApi = {
  list: (params?: any) => request.get<any, PageData<Complaint>>('/complaints', { params }),
  stats: () => request.get<any, any>('/complaints/stats'),
  detail: (id: number) => request.get<any, Complaint>(`/complaints/${id}`),
  create: (data: Partial<Complaint>) => request.post('/complaints', data),
  update: (id: number, data: Partial<Complaint>) => request.put(`/complaints/${id}`, data),
  assign: (id: number, data: { handler_id: number }) => request.post(`/complaints/${id}/assign`, data),
  review: (id: number, data: Partial<ComplaintReview>) => request.post(`/complaints/${id}/review`, data),
  close: (id: number) => request.post(`/complaints/${id}/close`),
  delete: (id: number) => request.delete(`/complaints/${id}`)
};

export const alertApi = {
  list: (params?: any) => request.get<any, PageData<Alert>>('/alerts', { params }),
  summary: () => request.get<any, any>('/alerts/summary'),
  detail: (id: number) => request.get<any, Alert>(`/alerts/${id}`),
  handle: (id: number, data: { handle_remark?: string }) => request.put(`/alerts/${id}/handle`, data),
  ignore: (id: number, data: { handle_remark?: string }) => request.put(`/alerts/${id}/ignore`, data),
  check: () => request.post('/alerts/check')
};
