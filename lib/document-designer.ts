export type DesignerElementType =
  | "text"
  | "heading"
  | "paragraph"
  | "image"
  | "logo"
  | "table"
  | "line"
  | "box"
  | "signature"
  | "date"
  | "pageNumber"
  | "checkbox"
  | "qrCode"
  | "barcode"
  | "dynamicField";

export type DesignerPage = {
  id: string;
  name: string;
  order: number;
  width: number;
  height: number;
  background?: string;
};

export type DesignerElement = {
  id: string;
  type: DesignerElementType;
  pageId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: Record<string, string | number | boolean>;
  config: Record<string, string | number | boolean | string[]>;
};

export type DesignerSnapshot = {
  selectedPageId: string;
  selectedElementId: string | null;
  zoom: number;
  pages: DesignerPage[];
  elements: DesignerElement[];
  isDirty: boolean;
  isSaving: boolean;
};

export type DesignerHistory = {
  past: DesignerSnapshot[];
  present: DesignerSnapshot;
  future: DesignerSnapshot[];
};

export const dynamicFieldKeys = [
  "company.name",
  "company.taxId",
  "company.address",
  "customer.name",
  "customer.taxId",
  "document.documentNo",
  "document.date",
  "document.total",
  "employee.name",
  "employee.position",
] as const;

export const sampleDocumentData = {
  company: {
    name: "Prompt Me Co., Ltd.",
    taxId: "0105566000001",
    address: "999 ถนนสาทร กรุงเทพฯ 10120",
  },
  customer: {
    name: "Blue Ocean Studio",
    taxId: "0105565005678",
  },
  document: {
    documentNo: "QT-2026-0718",
    date: "08/07/2026",
    total: "128,500.00",
  },
  employee: {
    name: "คุณวราภรณ์",
    position: "Senior Accountant",
  },
};

function getByPath(data: unknown, path: string): string {
  const value = path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in current) {
      return (current as Record<string, unknown>)[key];
    }

    return undefined;
  }, data);

  if (value === undefined || value === null) return "";
  return String(value);
}

export function renderDynamicFields(template: string, dataJson: unknown): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => getByPath(dataJson, key));
}

export function renderElementContent(element: DesignerElement, dataJson: unknown): string {
  if (element.type === "dynamicField") {
    return renderDynamicFields(`{{${element.content}}}`, dataJson);
  }

  return renderDynamicFields(element.content, dataJson);
}

