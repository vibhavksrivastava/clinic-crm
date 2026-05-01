// Types and interfaces for Clinic CRM Multi-Clinic Architecture

// =====================================================
// ORGANIZATION (Clinic) TYPES
// =====================================================
export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'suspended';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  maxStaff: number;
  maxPatients: number;
  maxBranches: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

// =====================================================
// BRANCH TYPES
// =====================================================
export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// ROLE & PERMISSION TYPES
// =====================================================
export type RoleType = 'super_admin' | 'clinic_admin' | 'branch_admin' | 'doctor' | 'receptionist' | 'nurse' | 'pharmacist';

export type Permission = 
  | 'manage_organization'
  | 'manage_branches'
  | 'manage_staff'
  | 'manage_patients'
  | 'manage_appointments'
  | 'manage_prescriptions'
  | 'manage_pharmacy'
  | 'manage_invoices'
  | 'write_prescription'
  | 'book_appointment'
  | 'create_invoice'
  | 'dispense_medication'
  | 'view_analytics'
  | 'manage_roles'
  | 'manage_billing';

export interface Role {
  id: string;
  name: string;
  description?: string;
  roleType: RoleType;
  permissions: Permission[];
  isSystemRole: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// USER TYPES
// =====================================================
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  passwordHash?: string; // Should not be exposed
  firstName: string;
  lastName: string;
  phone?: string;
  profilePictureUrl?: string;
  specialization?: string; // For doctors
  licenseNumber?: string; // For doctors
  roleId?: string;
  organizationId: string;
  branchId?: string;
  userStatus: UserStatus;
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithRole extends User {
  role?: Role | string;
}

// =====================================================
// PATIENT TYPES (Extended)
// =====================================================
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: string;
  organizationId: string;
  branchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// APPOINTMENT TYPES (Extended)
// =====================================================
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show';

export interface Appointment {
  id: string;
  patientId: string;
  staffId: string;
  scheduleSlotId?: string;
  appointmentDate: Date;
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  organizationId: string;
  branchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// PRESCRIPTION TYPES (Extended)
// =====================================================
export type PrescriptionStatus = 'active' | 'inactive' | 'expired';
export type PharmacyStatus = 'pending' | 'dispensed' | 'picked_up';

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  quantity: number;
  duration?: string;
  instructions?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  staffId: string;
  medications: Medication[];
  issuedDate: Date;
  expiryDate?: Date;
  status: PrescriptionStatus;
  pharmacyStatus: PharmacyStatus;
  dispensedById?: string;
  dispensedDate?: Date;
  notes?: string;
  organizationId: string;
  branchId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// PHARMACY TYPES
// =====================================================
export interface PharmacyProduct {
  id: string;
  organizationId: string;
  branchId?: string;
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  category?: string;
  unitPrice: number;
  costPrice?: number;
  reorderLevel: number;
  isActive: boolean;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PharmacyStock {
  id: string;
  productId: string;
  organizationId: string;
  branchId: string;
  quantity: number;
  batchNumber?: string;
  expiryDate?: Date;
  supplierId?: string;
  purchasePrice?: number;
  purchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = 'purchase' | 'stock_in' | 'stock_out' | 'dispense' | 'adjustment' | 'return';

export interface PharmacyTransaction {
  id: string;
  productId: string;
  organizationId: string;
  branchId: string;
  transactionType: TransactionType;
  quantity: number;
  referenceId?: string;
  performedById?: string;
  notes?: string;
  createdAt: Date;
}

// =====================================================
// APPOINTMENT SCHEDULE TYPES
// =====================================================
export interface AppointmentSchedule {
  id: string;
  doctorId: string;
  organizationId: string;
  branchId: string;
  dayOfWeek: number; // 0-6 (Sunday to Saturday)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  slotDurationMinutes: number;
  breakStart?: string;
  breakEnd?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// AUDIT LOG TYPES
// =====================================================
export interface AuditLog {
  id: string;
  userId?: string;
  organizationId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================
export type NotificationType = 'appointment_reminder' | 'prescription_ready' | 'invoice_generated' | 'appointment_confirmation';
export type NotificationMethod = 'email' | 'sms' | 'whatsapp';

export interface NotificationSettings {
  id: string;
  organizationId: string;
  branchId?: string;
  notificationType: NotificationType;
  enabled: boolean;
  method: NotificationMethod;
  template?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// WHATSAPP TYPES
// =====================================================
export type WhatsAppMessageType = 'appointment_confirmation' | 'appointment_reminder' | 'prescription_ready' | 'appointment_booking' | 'custom';
export type WhatsAppStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'read';

export interface WhatsAppMessage {
  id: string;
  organizationId: string;
  phoneNumber: string;
  messageType: WhatsAppMessageType;
  messageContent: string;
  relatedEntityId?: string;
  status: WhatsAppStatus;
  errorMessage?: string;
  sentAt?: Date;
  createdAt: Date;
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

// Create Organization Request
export interface CreateOrganizationRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

// Create Branch Request
export interface CreateBranchRequest {
  organizationId: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}

// Create User Request
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  organizationId: string;
  branchId?: string;
  specialization?: string; // For doctors
}

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
  organizationId?: string;
  branchId?: string;
}

// Login Response
export interface LoginResponse {
  user: UserWithRole;
  token: string;
  organization: Organization;
  branch?: Branch;
}

// Generic API Response
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
