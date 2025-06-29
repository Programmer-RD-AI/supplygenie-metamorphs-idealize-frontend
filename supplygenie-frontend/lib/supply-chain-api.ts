// API utility functions for supply chain operations

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface SupplierApiResponse {
  company_name: string;
  location?: string;
  rating?: number;
  price_range?: string;
  lead_time?: string;
  moq?: string;
  certifications?: string[];
  specialties?: string[];
  response_time?: string;
  contact?: string;
}

export interface SupplyChainApiResponse {
  suppliers: SupplierApiResponse[];
}

export interface SupplyChainRequest {
  query: string;
  chat_history: ChatHistoryItem[];
}

export class SupplyChainApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'SupplyChainApiError';
  }
}

export async function getSupplierRecommendations(
  query: string,
  chatHistory: ChatHistoryItem[] = []
): Promise<SupplyChainApiResponse> {
  const request: SupplyChainRequest = {
    query,
    chat_history: chatHistory,
  };

  const response = await fetch('/api/supply-chain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new SupplyChainApiError(
      errorData.error || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return response.json();
}

export function transformSupplierData(supplier: SupplierApiResponse, index: number) {
  const fields = [
    { label: "Location", value: supplier.location || "N/A", type: "location" as const },
    { label: "Rating", value: supplier.rating?.toString() || "N/A", type: "rating" as const },
    { label: "Price Range", value: supplier.price_range || "N/A", type: "price" as const },
    { label: "Lead Time", value: supplier.lead_time || "N/A", type: "time" as const },
    { label: "Response Time", value: supplier.response_time || "N/A", type: "time" as const },
    { label: "MOQ", value: supplier.moq || "N/A", type: "text" as const },
    { label: "Specialties", value: (supplier.specialties && supplier.specialties.length > 0) ? supplier.specialties.join(", ") : "N/A", type: "badge" as const },
    { label: "Contact Details", value: supplier.contact || "N/A", type: "text" as const },
  ];

  // Only add certifications if they exist and are not empty
  if (supplier.certifications && supplier.certifications.length > 0) {
    fields.splice(6, 0, { 
      label: "Certifications", 
      value: supplier.certifications.join(", "), 
      type: "badge" as const 
    });
  }

  return {
    id: `supplier_${Date.now()}_${index}`,
    name: supplier.company_name || "Unknown Supplier",
    fields
  };
}
