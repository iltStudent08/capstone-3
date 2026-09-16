import { Schema, model, Document, Types } from "mongoose";

export type ClaimStatus = "submitted" | "under-review" | "approved" | "denied" | "closed";

export interface IClaimNote {
  author: Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IClaim extends Document {
  claimNumber: string;
  policy: Types.ObjectId;
  description: string;
  incidentDate: Date;
  amount: number;
  status: ClaimStatus;
  assignedTo: Types.ObjectId;
  notes: IClaimNote[];
  createdAt: Date;
  updatedAt: Date;
}

const claimNoteSchema = new Schema<IClaimNote>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    text: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const claimSchema = new Schema<IClaim>(
  {
    claimNumber: {
      type: String,
      unique: true,
    },
    policy: {
      type: Schema.Types.ObjectId,
      ref: "Policy",
    },
    description: {
      type: String,
      required: true,
    },
    incidentDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["submitted", "under-review", "approved", "denied", "closed"],
      default: "submitted",
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    notes: {
      type: [claimNoteSchema],
      default: [],
    },
  },
  { timestamps: true }
);

claimSchema.pre("save", async function () {
  if (!this.isNew || this.claimNumber) return;
  const count = await model<IClaim>("Claim").countDocuments();
  this.claimNumber = `CLM-${1001 + count}`;
});

export default model<IClaim>("Claim", claimSchema);
