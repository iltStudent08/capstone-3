import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import api from "../api";
import type { Paginated, Policy, PolicyStatus, PolicyType } from "../types";

const TYPE_OPTIONS: PolicyType[] = ["auto", "home", "life"];
const STATUS_OPTIONS: PolicyStatus[] = ["active", "expired", "cancelled"];
const TYPE_LABELS: Record<PolicyType, string> = { auto: "Auto", home: "Home", life: "Life" };
const STATUS_LABELS: Record<PolicyStatus, string> = { active: "Active", expired: "Expired", cancelled: "Cancelled" };

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const formatDate = (value: string) => new Date(value).toLocaleDateString();

const emptyForm = {
  policyNumber: "",
  holderName: "",
  type: "auto" as PolicyType,
  premium: "",
  status: "active" as PolicyStatus,
  effectiveDate: "",
  expirationDate: "",
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const limit = 10;

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Paginated<Policy>>("/policies", {
        params: { page, limit, type: type || undefined, search: search || undefined },
      });
      setPolicies(data.data);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setError(null);
    } catch {
      setError("Failed to load policies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
    // Reload whenever the page, type filter, or search term changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, type, search]);


  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.policyNumber.trim() || !form.holderName.trim() || !form.premium || !form.effectiveDate || !form.expirationDate) {
      setFormError("All fields are required");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/policies", {
        policyNumber: form.policyNumber.trim(),
        holderName: form.holderName.trim(),
        type: form.type,
        premium: Number(form.premium),
        status: form.status,
        effectiveDate: form.effectiveDate,
        expirationDate: form.expirationDate,
      });
      setForm(emptyForm);
      setShowForm(false);
      setPage(1);
      await loadPolicies();
    } catch {
      setFormError("Failed to create policy");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this policy? This cannot be undone.");
    if (!confirmed) return;

    try {
      await api.delete(`/policies/${id}`);
      await loadPolicies();
    } catch {
      setError("Failed to delete policy");
    }
  };

  return (
    <div className="page policies-page">
      <div className="page-header">
        <h1>Policies</h1>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Cancel" : "New Policy"}
        </button>
      </div>

      {showForm && (
        <form className="card inline-form" onSubmit={handleCreate}>
          {formError && <p className="form-error">{formError}</p>}
          <div className="form-field">
            <label htmlFor="policy-number">Policy Number</label>
            <input
              id="policy-number"
              type="text"
              value={form.policyNumber}
              onChange={(event) => setForm({ ...form, policyNumber: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="holder-name">Holder Name</label>
            <input
              id="holder-name"
              type="text"
              value={form.holderName}
              onChange={(event) => setForm({ ...form, holderName: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="policy-type">Type</label>
            <select
              id="policy-type"
              value={form.type}
              onChange={(event) => setForm({ ...form, type: event.target.value as PolicyType })}
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {TYPE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="policy-premium">Premium</label>
            <input
              id="policy-premium"
              type="number"
              min="0"
              step="0.01"
              value={form.premium}
              onChange={(event) => setForm({ ...form, premium: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="policy-status">Status</label>
            <select
              id="policy-status"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as PolicyStatus })}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="policy-effective-date">Effective Date</label>
            <input
              id="policy-effective-date"
              type="date"
              value={form.effectiveDate}
              onChange={(event) => setForm({ ...form, effectiveDate: event.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="policy-expiration-date">Expiration Date</label>
            <input
              id="policy-expiration-date"
              type="date"
              value={form.expirationDate}
              onChange={(event) => setForm({ ...form, expirationDate: event.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Creating..." : "Create Policy"}
          </button>
        </form>
      )}

      <div className="card filter-bar">
        <div className="form-field">
          <label htmlFor="type-filter">Type</label>
          <select
            id="type-filter"
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {TYPE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="policy-search">Search</label>
          <input
            id="policy-search"
            type="text"
            placeholder="Holder name or policy number"
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
              <th>Policy #</th>
              <th>Holder</th>
              <th>Type</th>
              <th>Premium</th>
              <th>Status</th>
              <th>Effective</th>
              <th>Expiration</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>Loading...</td>
              </tr>
            ) : policies.length === 0 ? (
              <tr>
                <td colSpan={8}>No policies found</td>
              </tr>
            ) : (
              policies.map((policy) => (
                <tr key={policy._id}>
                  <td>{policy.policyNumber}</td>
                  <td>{policy.holderName}</td>
                  <td>{TYPE_LABELS[policy.type]}</td>
                  <td>{currencyFormatter.format(policy.premium)}</td>
                  <td>
                    <span className={`badge badge-${policy.status}`}>{STATUS_LABELS[policy.status]}</span>
                  </td>
                  <td>{formatDate(policy.effectiveDate)}</td>
                  <td>{formatDate(policy.expirationDate)}</td>
                  <td>
                    <button type="button" className="btn btn-danger btn-small" onClick={() => handleDelete(policy._id)}>
                      Delete
                    </button>
                  </td>
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
