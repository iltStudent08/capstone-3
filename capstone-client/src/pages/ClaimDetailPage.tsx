import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import type { Claim, ClaimStatus, User } from "../types";

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
const formatDateTime = (value: string) => new Date(value).toLocaleString();

const describePolicy = (policy: Claim["policy"]) =>
  typeof policy === "object" ? `${policy.policyNumber} - ${policy.holderName}` : policy;

const describeUser = (user: Claim["assignedTo"] | Claim["notes"][number]["author"]) =>
  typeof user === "object" ? (user as User).name : user;

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusValue, setStatusValue] = useState<ClaimStatus>("submitted");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [noteText, setNoteText] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [addingNote, setAddingNote] = useState(false);

  const loadClaim = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await api.get<{ claim: Claim }>(`/claims/${id}`);
      setClaim(data.claim);
      setStatusValue(data.claim.status);
      setError(null);
    } catch {
      setError("Failed to load claim");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClaim();
  }, [loadClaim]);

  const handleStatusUpdate = async () => {
    if (!id || !claim) return;
    setUpdatingStatus(true);
    try {
      const { data } = await api.put<{ claim: Claim }>(`/claims/${id}`, { status: statusValue });
      setClaim(data.claim);
    } catch {
      setError("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (event: FormEvent) => {
    event.preventDefault();
    setNoteError(null);

    if (!noteText.trim()) {
      setNoteError("Note text is required");
      return;
    }

    setAddingNote(true);
    try {
      const { data } = await api.post<{ claim: Claim }>(`/claims/${id}/notes`, { text: noteText.trim() });
      setClaim(data.claim);
      setNoteText("");
    } catch {
      setNoteError("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm("Are you sure you want to delete this claim? This cannot be undone.");
    if (!confirmed) return;

    try {
      await api.delete(`/claims/${id}`);
      navigate("/claims", { replace: true });
    } catch {
      setError("Failed to delete claim");
    }
  };

  if (loading) return <div className="page-loading">Loading claim...</div>;
  if (error && !claim) return <div className="page-error">{error}</div>;
  if (!claim) return null;

  return (
    <div className="page claim-detail-page">
      <div className="page-header">
        <h1>{claim.claimNumber}</h1>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>
          Delete Claim
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="card">
        <dl className="detail-grid">
          <div>
            <dt>Policy</dt>
            <dd>{describePolicy(claim.policy)}</dd>
          </div>
          <div>
            <dt>Assigned To</dt>
            <dd>{describeUser(claim.assignedTo)}</dd>
          </div>
          <div>
            <dt>Incident Date</dt>
            <dd>{formatDate(claim.incidentDate)}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>{currencyFormatter.format(claim.amount)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`badge badge-${claim.status}`}>{STATUS_LABELS[claim.status]}</span>
            </dd>
          </div>
        </dl>

        <div className="detail-description">
          <h2>Description</h2>
          <p>{claim.description}</p>
        </div>

        <div className="status-update">
          <label htmlFor="status-select">Update Status</label>
          <select
            id="status-select"
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value as ClaimStatus)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {STATUS_LABELS[option]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-primary"
            disabled={updatingStatus || statusValue === claim.status}
            onClick={handleStatusUpdate}
          >
            {updatingStatus ? "Updating..." : "Update Status"}
          </button>
        </div>
      </div>

      <div className="card">
        <h2>Notes</h2>
        <ul className="notes-list">
          {claim.notes.length === 0 && <li>No notes yet</li>}
          {claim.notes.map((note, index) => (
            <li key={index} className="note-item">
              <p>{note.text}</p>
              <span className="note-meta">
                {describeUser(note.author)} &middot; {formatDateTime(note.createdAt)}
              </span>
            </li>
          ))}
        </ul>

        <form className="note-form" onSubmit={handleAddNote}>
          {noteError && <p className="form-error">{noteError}</p>}
          <textarea
            placeholder="Add a note..."
            value={noteText}
            onChange={(event) => setNoteText(event.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={addingNote}>
            {addingNote ? "Adding..." : "Add Note"}
          </button>
        </form>
      </div>
    </div>
  );
}
