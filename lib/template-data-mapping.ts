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
    doc_date: data.date || data.po_date || "",
    expire_date: data.dueDate || data.po_dueDate || "",
    credit_term: data.creditDays || data.po_paymentTerms || "",
    remarks: data.remarks || "",
    subtotal: money(data.subtotal || data.po_subTotal),
    discount: money(data.discountAmount),
    vat: money(data.vatAmount || data.po_vat),
    total_amount: money(total || data.po_grandTotal),

    // PO Specific Fields
    po_vendor_name: data.po_vendorName || "",
    po_vendor_address: data.po_vendorAddress || "",
    po_vendor_taxid: data.po_vendorTaxId || "",
    po_ref_no: data.po_refNo || "",
    po_buyer: data.po_buyer || "",
    po_project_name: data.po_projectName || "",
    po_contact_name: data.po_contactName || "",
    po_contact_phone: data.po_contactPhone || "",
    po_contact_email: data.po_contactEmail || "",
    po_delivery_date: data.po_deliveryDate || "",

    // Invoice Specific Fields
    inv_customer_name: data.inv_customerName || "",
    inv_customer_address: data.inv_customerAddress || "",
    inv_customer_taxid: data.inv_customerTaxId || "",
    inv_ref_no: data.inv_refNo || "",
    inv_seller: data.inv_seller || "",

    // Withholding Tax (50 Tawi) Specific Fields
    wht_payer_name: data.wht_payerName || "",
    wht_payer_address: data.wht_payerAddress || "",
    wht_payer_taxid: data.wht_payerTaxId || "",
    wht_payee_name: data.wht_payeeName || "",
    wht_payee_address: data.wht_payeeAddress || "",
    wht_payee_taxid: data.wht_payeeTaxId || "",
    wht_form_type: data.wht_formType || "",
    wht_date: data.wht_date || "",
    wht_items: data.wht_items || [],
  }
}
