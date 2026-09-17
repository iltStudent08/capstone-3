export type UserRole = "adjuster" | "admin";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type PolicyType = "auto" | "home" | "life";
export type PolicyStatus = "active" | "expired" | "cancelled";

export interface Policy {
  _id: string;
  policyNumber: string;
  holderName: string;
  type: PolicyType;
  premium: number;
  status: PolicyStatus;
  effectiveDate: string;
  expirationDate: string;
  owner: string | User;
  createdAt: string;
}

export type ClaimStatus = "submitted" | "under-review" | "approved" | "denied" | "closed";

export interface ClaimNote {
  author: string | User;
  text: string;
  createdAt: string;
}

export interface Claim {
  _id: string;
  claimNumber: string;
  policy: string | Policy;
  description: string;
  incidentDate: string;
  amount: number;
  status: ClaimStatus;
  assignedTo: string | User;
  notes: ClaimNote[];
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ClaimStats {
  byStatus: Record<ClaimStatus, number>;
  totalClaims: number;
  totalAmount: number;
}

export interface DashboardStats {
  totalClaims: number;
  claimsByStatus: Record<ClaimStatus, number>;
  totalPolicies: number;
  policiesByType: Record<PolicyType, number>;
  totalUsers: number;
  recentClaims: Claim[];
  totalClaimAmount: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
