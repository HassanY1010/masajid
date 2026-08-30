export enum ProjectCategory {
  CONSTRUCTION = 'CONSTRUCTION',
  RENOVATION = 'RENOVATION',
  MAINTENANCE = 'MAINTENANCE',
  SOLAR = 'SOLAR',
  WATER = 'WATER',
  ELECTRICITY = 'ELECTRICITY',
  CLEANING = 'CLEANING',
  FURNISHING = 'FURNISHING',
  QURAN_SUPPLIES = 'QURAN_SUPPLIES',
  OTHER = 'OTHER',
}

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  FUNDING = 'FUNDING',
  FULLY_FUNDED = 'FULLY_FUNDED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum ProjectImageType {
  COVER = 'COVER',
  GALLERY = 'GALLERY',
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

export enum ContributionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AuditAction {
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_LOGOUT = 'ADMIN_LOGOUT',
  ADMIN_CREATED_PROJECT = 'ADMIN_CREATED_PROJECT',
  ADMIN_UPDATED_PROJECT = 'ADMIN_UPDATED_PROJECT',
  ADMIN_PUBLISHED_PROJECT = 'ADMIN_PUBLISHED_PROJECT',
  ADMIN_UNPUBLISHED_PROJECT = 'ADMIN_UNPUBLISHED_PROJECT',
  ADMIN_ARCHIVED_PROJECT = 'ADMIN_ARCHIVED_PROJECT',
  ADMIN_DELETED_PROJECT = 'ADMIN_DELETED_PROJECT',
  ADMIN_APPROVED_CONTRIBUTION = 'ADMIN_APPROVED_CONTRIBUTION',
  ADMIN_REJECTED_CONTRIBUTION = 'ADMIN_REJECTED_CONTRIBUTION',
  ADMIN_CREATED_BANK_ACCOUNT = 'ADMIN_CREATED_BANK_ACCOUNT',
  ADMIN_UPDATED_BANK_ACCOUNT = 'ADMIN_UPDATED_BANK_ACCOUNT',
  ADMIN_DELETED_BANK_ACCOUNT = 'ADMIN_DELETED_BANK_ACCOUNT',
  ADMIN_CREATED_UPDATE = 'ADMIN_CREATED_UPDATE',
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectImageDto {
  id: string;
  projectId: string;
  url: string;
  storageKey: string;
  type: ProjectImageType;
  sortOrder: number;
  createdAt: Date;
}

export interface ProjectUpdateDto {
  id: string;
  projectId: string;
  title: string;
  description: string;
  images: string[];
  createdAt: Date;
}

export interface BankAccountDto {
  id: string;
  name: string;
  displayName: string;
  accountName: string;
  accountNumber: string;
  iban?: string | null;
  currency: string;
  logoUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDto {
  id: string;
  title: string;
  mosqueName: string;
  governorate: string;
  district: string;
  locationText: string;
  latitude?: number | null;
  longitude?: number | null;
  description: string;
  needDescription: string;
  category: ProjectCategory;
  estimatedCost: number;
  currency: string;
  totalShares: number;
  shareValue: number;
  fundedShares: number;
  fundedAmount: number;
  status: ProjectStatus;
  isPublished: boolean;
  publishedAt?: Date | null;
  images?: ProjectImageDto[];
  updates?: ProjectUpdateDto[];
  createdAt: Date;
  updatedAt: Date;
  remainingShares?: number;
  remainingAmount?: number;
  fundingPercentage?: number;
}

export interface ContributionDto {
  id: string;
  projectId: string;
  amount: number;
  currency: string;
  shares: number;
  donorName?: string | null;
  donorPhone?: string | null;
  paymentMethod?: string | null;
  receiptUrl?: string | null;
  receiptStorageKey?: string | null;
  status: ContributionStatus;
  rejectionReason?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  project?: {
    id: string;
    title: string;
    mosqueName: string;
  };
}

export interface DashboardStatsDto {
  totalProjects: number;
  publishedProjects: number;
  fundingProjects: number;
  completedProjects: number;
  pendingContributions: number;
  approvedContributions: number;
  totalFundedAmount: number;
  totalFundedShares: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  error?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
