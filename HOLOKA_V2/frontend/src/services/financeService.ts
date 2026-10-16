import api from './api';
import type { PageResponse, InvoiceView, InvoiceStatus } from '../types';

export type { InvoiceView, InvoiceStatus };

export const listInvoices = async (
  workspaceId: number,
  opts?: {
    propertyId?: number;
    tenantId?: number;
    contractId?: number;
    status?: InvoiceStatus;
    billingMonth?: string;
    page?: number;
    size?: number;
  }
): Promise<PageResponse<InvoiceView>> => {
  const { data } = await api.get('/invoices', { params: { workspaceId, ...opts } });
  return data.data;
};

export const getInvoice = async (workspaceId: number, id: number): Promise<InvoiceView> => {
  const { data } = await api.get(`/invoices/${id}`, { params: { workspaceId } });
  return data.data;
};
