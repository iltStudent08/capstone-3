import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import type { Claim, ClaimStatus, Paginated, Policy } from "../types";

const STATUS_OPTIONS: ClaimStatus[] = ["submitted", "under-review", "approved", "denied", "closed"];
const STATUS_LABELS: Record<ClaimStatus, string> = {
  submitted: "Submitted",
  "under-review": "Under Review",
  approved: "Approved",
  denied: "Denied",
  closed: "Closed",
};

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatDate = (value: string) => new Date(value).toLocaleDateString();

const emptyForm = { policy: "", description: "", incidentDate: "", amount: "" };

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const limit = 10;

  useEffect(() => {
    api
      .get<Paginated<Policy>>("/policies", { params: { limit: 100 } })
      .then(({ data }) => setPolicies(data.data))
      .catch(() => setPolicies([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .get<Paginated<Claim>>("/claims", { params: { page, limit, status: status || undefined, search: search || undefined } })
      .then(({ data }) => {
        if (cancelled) return;
        setClaims(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setError(null);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load claims");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, status, search]);

  const policyLookup = new Map(policies.map((policy) => [policy._id, policy]));

  const describePolicy = (claim: Claim) => {
    if (typeof claim.policy === "object") return claim.policy.policyNumber;
    const policy = policyLookup.get(claim.policy);
    return policy ? policy.policyNumber : claim.policy;
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.policy || !form.description.trim() || !form.incidentDate || !form.amount) {
      setFormError("All fields are required");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/claims", {
        policy: form.policy,
        description: form.description.trim(),
        incidentDate: form.incidentDate,
        amount: Number(form.amount),
      });
      setForm(emptyForm);
      setShowForm(false);
      setPage(1);
      const { data } = await api.get<Paginated<Claim>>("/claims", { params: { page: 1, limit } });
      setClaims(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setFormError("Failed to create claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page claims-page">
      <div className="page-header">
        <h1>Claims</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Cancel" : "New Claim"}
        </button>
      </div>

      {showForm && (
        <form className="card inline-form" onSubmit={handleCreate}>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-field">
            <label htmlFor="claim-policy">Policy</label>
            <select
              id="claim-policy"
              value={form.policy}
              onChange={(event) => setForm({ ...form, policy: event.target.value })}
            >
              <option value="">Select a policy</option>
              {policies.map((policy) => (
                <option key={policy._id} value={policy._id}>
                  {policy.policyNumber} - {policy.holderName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="claim-description">Description</label>
            <input
              id="claim-description"
              type="text"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="claim-incident-date">Incident Date</label>
            <input
              id="claim-incident-date"
              type="date"
              value={form.incidentDate}
              onChange={(event) => setForm({ ...form, incidentDate: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="claim-amount">Amount</label>
            <input
              id="claim-amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create Claim"}
          </button>
        </form>
      )}

      <div className="card filter-bar">
        <div className="form-field">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="claim-search">Search</label>
          <input
            id="claim-search"
            type="text"
            placeholder="Claim number or description"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim #</th>
              <th>Policy</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Incident Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading...</td>
              </tr>
            ) : claims.length === 0 ? (
              <tr>
                <td colSpan={6}>No claims found</td>
              </tr>
            ) : (
              claims.map((claim) => (
                <tr key={claim._id}>
                  <td>
                    <Link to={`/claims/${claim._id}`}>{claim.claimNumber}</Link>
                  </td>
                  <td>{describePolicy(claim)}</td>
                  <td>{claim.description}</td>
                  <td>{currencyFormatter.format(claim.amount)}</td>
                  <td>
                    <span className={`badge badge-${claim.status}`}>{STATUS_LABELS[claim.status]}</span>
                  </td>
                  <td>{formatDate(claim.incidentDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages} ({total} total)
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
