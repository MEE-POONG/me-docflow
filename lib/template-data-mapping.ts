type CompanyLike = {
  name?: string | null
  taxId?: string | null
  address?: string | null
  phone?: string | null
} | null | undefined

type CreatedByLike = {
  name?: string | null
  role?: string | null
} | null | undefined

type DocumentLike = {
  documentNo?: string | null
  dataJson?: unknown
}

function money(value: unknown) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Templates in this app bind data two different ways depending on how they were
 * authored: nested dot-paths (company.name) per lib/document-designer.ts's
 * dynamicFieldKeys, or flat snake_case keys ({{customer_name}}, {{doc_no}}, ...)
 * as actually used by the seeded "Standard Quotation Template". Both conventions
 * are returned on the same object so either resolves via getByPath's direct-key
 * lookup or dot-path traversal.
 */
export function mapDocumentToTemplateData(
  document: DocumentLike,
  company?: CompanyLike,
  createdBy?: CreatedByLike
) {
  const data =
    typeof document.dataJson === "string"
      ? (() => {
          try {
            return JSON.parse(document.dataJson as string)
          } catch {
            return {}
          }
        })()
      : (document.dataJson as Record<string, any>) || {}

  const total = data.grandTotal ?? data.total ?? 0

  return {
    // Nested convention (lib/document-designer.ts dynamicFieldKeys)
    company: {
      name: company?.name || "",
      taxId: company?.taxId || "",
      address: company?.address || "",
    },
    customer: {
      name: data.partnerName || "",
      taxId: data.taxId || "",
    },
    document: {
      documentNo: document.documentNo || "",
      date: data.date || "",
      total: money(total),
    },
    employee: {
      name: createdBy?.name || "",
      position: createdBy?.role || "",
    },
    items: Array.isArray(data.items) ? data.items : [],

    // Flat snake_case convention (as used by templates seeded outside the designer)
    customer_name: data.partnerName || "",
    customer_address: data.address || "",
    customer_taxid: data.taxId || "",
    company_name: company?.name || "",
    company_address: company?.address || "",
    company_phone: company?.phone || "",
    company_taxid: company?.taxId || "",
    doc_no: document.documentNo || "",
    doc_date: data.date || "",
    expire_date: data.dueDate || "",
    credit_term: data.creditDays ?? "",
    remarks: data.remarks || "",
    subtotal: money(data.subtotal),
    discount: money(data.discountAmount),
    vat: money(data.vatAmount),
    total_amount: money(total),
  }
}
