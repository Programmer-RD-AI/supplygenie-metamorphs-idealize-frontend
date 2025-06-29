export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface SupplierResponse {
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

export interface SupplyChainResponse {
  suppliers: SupplierResponse[];
}

export class SupplyChainApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "SupplyChainApiError";
  }
}

export async function getSupplierRecommendations(
  query: string,
  chatHistory: ChatHistoryItem[] = []
): Promise<SupplyChainResponse> {
  const res = await fetch("/api/supply-chain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, chat_history: chatHistory }),
  });

  if (!res.ok) {
    throw new SupplyChainApiError(res.status, await res.text());
  }

  return res.json();
}

interface SupplierField {
  label: string;
  value: string;
  type: "text" | "badge" | "rating" | "price" | "location" | "time";
}

interface Supplier {
  id: string;
  name: string;
  fields: SupplierField[];
}

export function transformSupplierData(
  supplier: SupplierResponse,
  index: number
): Supplier {
  const fields: SupplierField[] = [];

  if (supplier.location) {
    fields.push({ label: "Location", value: supplier.location, type: "location" });
  }

  if (typeof supplier.rating === "number") {
    fields.push({ label: "Rating", value: supplier.rating.toString(), type: "rating" });
  }

  if (supplier.price_range) {
    fields.push({ label: "Price Range", value: supplier.price_range, type: "price" });
  }

  if (supplier.lead_time) {
    fields.push({ label: "Lead Time", value: supplier.lead_time, type: "time" });
  }

  if (supplier.response_time) {
    fields.push({ label: "Response Time", value: supplier.response_time, type: "time" });
  }

  if (supplier.moq) {
    fields.push({ label: "MOQ", value: supplier.moq, type: "text" });
  }

  if (supplier.certifications) {
    fields.push({ label: "Certifications", value: supplier.certifications.join(", "), type: "badge" });
  }

  if (supplier.specialties) {
    fields.push({ label: "Specialties", value: supplier.specialties.join(", "), type: "badge" });
  }

  if (supplier.contact) {
    fields.push({ label: "Contact Details", value: supplier.contact, type: "text" });
  }

  return {
    id: `supplier_${index}`,
    name: supplier.company_name,
    fields,
  };
}
