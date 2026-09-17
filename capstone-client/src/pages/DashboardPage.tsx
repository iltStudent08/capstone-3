import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import type { ClaimStatus, DashboardStats } from "../types";

const STATUS_LABELS: Record<ClaimStatus, string> = {
  submitted: "Submitted",
  "under-review": "Under Review",
  approved: "Approved",
  denied: "Denied",
  closed: "Closed",
};

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data } = await api.get<DashboardStats>("/dashboard");
        if (!cancelled) setStats(data);
      } catch {
        if (!cancelled) setError("Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="page-loading">Loading dashboard...</div>;
  if (error) return <div className="page-error">{error}</div>;
  if (!stats) return null;

  const statusCounts = Object.entries(STATUS_LABELS).map(([status, label]) => ({
    status: status as ClaimStatus,
    label,
    count: stats.claimsByStatus[status as ClaimStatus] ?? 0,
  }));
  const maxStatusCount = Math.max(1, ...statusCounts.map((entry) => entry.count));

  return (
    <div className="page dashboard-page">
      <h1>Dashboard</h1>

      <div className="stat-grid">
        <div className="card stat-card">
          <span className="stat-label">Total Claims</span>
          <span className="stat-value">{stats.totalClaims}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total Policies</span>
          <span className="stat-value">{stats.totalPolicies}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{stats.totalUsers}</span>
        </div>
        <div className="card stat-card">
          <span className="stat-label">Total Claim Amount</span>
          <span className="stat-value">{currencyFormatter.format(stats.totalClaimAmount)}</span>
        </div>
      </div>

      <div className="card">
        <h2>Claims by Status</h2>
        <div className="status-bars">
          {statusCounts.map(({ status, label, count }) => (
            <div className="status-bar-row" key={status}>
              <span className="status-bar-label">{label}</span>
              <div className="status-bar-track">
                <div
                  className={`status-bar-fill status-${status}`}
                  style={{ width: `${(count / maxStatusCount) * 100}%` }}
                />
              </div>
              <span className="status-bar-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Recent Claims</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentClaims.map((claim) => (
              <tr key={claim._id}>
                <td>
                  <Link to={`/claims/${claim._id}`}>{claim.claimNumber}</Link>
                </td>
                <td>{claim.description}</td>
                <td>{currencyFormatter.format(claim.amount)}</td>
                <td>
                  <span className={`badge badge-${claim.status}`}>{STATUS_LABELS[claim.status]}</span>
                </td>
              </tr>
            ))}
            {stats.recentClaims.length === 0 && (
              <tr>
                <td colSpan={4}>No recent claims</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
