/** Validate the editable fields currently displayed by the selected document form. */
export function validateDocumentFields(form: HTMLFormElement): boolean {
  const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('input, textarea, select')
  for (const field of fields) {
    if (field.dataset?.optional === 'true') {
      field.required = false
      field.setCustomValidity('')
      continue
    }
    if (field.disabled || ('readOnly' in field && field.readOnly)
      || ['hidden', 'checkbox', 'radio', 'file', 'search', 'button', 'submit', 'reset'].includes(field.type)
      || field.getClientRects().length === 0) continue
    field.required = true
    field.setCustomValidity(field.value.trim() ? '' : 'กรุณากรอกข้อมูลช่องนี้ให้ครบถ้วน')
  }
  return form.reportValidity()
}
