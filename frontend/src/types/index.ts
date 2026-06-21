export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface PageData<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface User {
  id: number;
  username: string;
  real_name: string;
  phone?: string;
  role: 'cleaner' | 'supervisor' | 'hotline' | 'admin';
  area_id?: number;
  status: number;
  area_name?: string;
}

export interface LoginData {
  token: string;
  user: User;
}

export interface Area {
  id: number;
  name: string;
  description?: string;
  supervisor_id?: number;
  supervisor_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Toilet {
  id: number;
  code: string;
  name: string;
  address: string;
  area_id: number;
  area_name?: string;
  longitude?: number;
  latitude?: number;
  level: 'A' | 'B' | 'C';
  opening_hours?: string;
  status: 'normal' | 'closed' | 'maintenance';
  toilet_paper_stock: number;
  toilet_paper_threshold: number;
  hand_sanitizer_stock: number;
  hand_sanitizer_threshold: number;
  peak_start_time?: string;
  peak_end_time?: string;
  toilet_paper_low?: number;
  hand_sanitizer_low?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Schedule {
  id: number;
  toilet_id: number;
  toilet_name?: string;
  toilet_code?: string;
  toilet_address?: string;
  cleaner_id: number;
  cleaner_name?: string;
  cleaner_phone?: string;
  schedule_date: string;
  shift_start: string;
  shift_end: string;
  shift_type: 'morning' | 'afternoon' | 'night' | 'all';
  status: 'scheduled' | 'completed' | 'absent';
  created_at?: string;
  updated_at?: string;
}

export interface CheckIn {
  id: number;
  schedule_id: number;
  toilet_id: number;
  toilet_name?: string;
  cleaner_id: number;
  cleaner_name?: string;
  check_in_time: string;
  check_in_type: 'on_duty' | 'off_duty' | 'patrol';
  longitude?: number;
  latitude?: number;
  photo_url?: string;
  status_remark?: string;
  cleanliness_score?: number;
  equipment_status?: any;
  supply_status?: any;
  created_at?: string;
}

export interface SupplyOrder {
  id: number;
  order_no: string;
  toilet_id: number;
  toilet_name?: string;
  toilet_code?: string;
  toilet_address?: string;
  order_type: 'auto' | 'manual';
  status: 'pending' | 'assigned' | 'delivering' | 'completed' | 'cancelled';
  toilet_paper_qty: number;
  hand_sanitizer_qty: number;
  remark?: string;
  assigned_to?: number;
  assigned_name?: string;
  assigned_at?: string;
  completed_at?: string;
  created_by?: number;
  creator_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RepairOrder {
  id: number;
  order_no: string;
  toilet_id: number;
  toilet_name?: string;
  toilet_code?: string;
  toilet_address?: string;
  equipment_name: string;
  fault_description: string;
  fault_level: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'repairing' | 'completed' | 'cancelled';
  photo_url?: string;
  reporter_id?: number;
  reporter_name?: string;
  assigned_to?: number;
  assigned_name?: string;
  assigned_at?: string;
  completed_at?: string;
  repair_result?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Complaint {
  id: number;
  complaint_no: string;
  toilet_id: number;
  toilet_name?: string;
  toilet_code?: string;
  toilet_address?: string;
  source: 'hotline' | 'online' | 'onsite' | 'other';
  category?: string;
  title: string;
  content: string;
  complainant_name?: string;
  complainant_phone?: string;
  status: 'pending' | 'processing' | 'reviewing' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  handler_id?: number;
  handler_name?: string;
  hotline_id?: number;
  hotline_name?: string;
  linked_complaint_id?: number;
  closed_at?: string;
  review_count?: number;
  reviews?: ComplaintReview[];
  created_at?: string;
  updated_at?: string;
}

export interface ComplaintReview {
  id: number;
  complaint_id: number;
  reviewer_id: number;
  reviewer_name?: string;
  review_time: string;
  review_result: 'passed' | 'failed' | 'recheck';
  review_content: string;
  photo_urls?: any;
  longitude?: number;
  latitude?: number;
  created_at?: string;
}

export interface Alert {
  id: number;
  alert_type: 'absent' | 'low_stock' | 'complaint_overdue';
  toilet_id?: number;
  toilet_name?: string;
  toilet_code?: string;
  schedule_id?: number;
  title: string;
  content: string;
  level: 'info' | 'warning' | 'danger';
  status: 'active' | 'handled' | 'ignored';
  handled_by?: number;
  handler_name?: string;
  handled_at?: string;
  handle_remark?: string;
  created_at?: string;
  updated_at?: string;
}
