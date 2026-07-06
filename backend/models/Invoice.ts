import mongoose, { Schema, Document } from 'mongoose';

export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
}

export interface ILineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  lineItems: ILineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: InvoiceStatus;
  dueDate: Date;
  notes?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<ILineItem>(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema: Schema<IInvoice> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true },
    lineItems: { type: [LineItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    taxAmount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      default: InvoiceStatus.DRAFT,
      index: true,
    },
    dueDate: { type: Date, required: true },
    notes: { type: String, trim: true, default: '' },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-recalculate totals before save
InvoiceSchema.pre('save', function (next) {
  const subtotal = this.lineItems.reduce((sum, item) => sum + item.amount, 0);
  this.subtotal = Math.round(subtotal * 100) / 100;
  this.taxAmount = Math.round((subtotal * this.taxRate) / 100 * 100) / 100;
  this.total = Math.round((this.subtotal + this.taxAmount) * 100) / 100;
  next();
});

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
