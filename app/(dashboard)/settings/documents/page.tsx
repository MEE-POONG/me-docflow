"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Eye, Hash, Save, Trash2 } from "lucide-react";
import { getDocumentNumberSettings, saveDocumentNumberSettings } from '@/app/actions/documents';
import { getDocumentActor } from '@/lib/document-actor';
import { formatDocumentNumber, type NumberSettingsRow } from '@/lib/document-numbering';

interface DocConfig {
  prefix: string;
  useDate: boolean;
  digits: number;
  startNumber: number;
}

function generatePreview(config: DocConfig) { return formatDocumentNumber(config); }

function DocumentConfigRow({ title, description, config, onChange, onDelete }: {
  title: string;
  description: string;
  config: DocConfig;
  onChange: (config: DocConfig) => void;
  onDelete?: () => void;
}) {
  const inputClass = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors";

  return (
    <section className="px-6 py-5">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-2">
          <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
          {onDelete && (
            <button type="button" onClick={onDelete} title="ลบหมวดหมู่" className="p-1 text-gray-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="inline-flex items-center gap-2 self-start border border-gray-200 bg-gray-50 px-3 py-1.5 rounded-lg text-xs text-gray-600">
          <Eye className="w-3.5 h-3.5 text-emerald-700" />
          <span>ตัวอย่างเลขเอกสาร</span>
          <code className="font-semibold text-gray-900">{generatePreview(config)}</code>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_220px] gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">คำขึ้นต้น (Prefix)</label>
          <input type="text" required value={config.prefix}
            onChange={(event) => onChange({ ...config, prefix: event.target.value })}
            className={`${inputClass} font-mono`} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">จำนวนหลักของเลขรัน</label>
          <select value={config.digits}
            onChange={(event) => onChange({ ...config, digits: Number(event.target.value) })}
            className={`${inputClass} bg-white`}>
            <option value={3}>3 หลัก (เช่น 001)</option>
            <option value={4}>4 หลัก (เช่น 0001)</option>
            <option value={5}>5 หลัก (เช่น 00001)</option>
            <option value={6}>6 หลัก (เช่น 000001)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">เลขเริ่มต้น (Start Number)</label>
          <input type="number" min={1} required value={config.startNumber}
            onChange={(event) => onChange({ ...config, startNumber: Math.max(1, Number(event.target.value)) })}
            className={inputClass} />
        </div>
        <div className="flex items-end pb-2.5">
          <label className="flex items-center text-sm text-gray-700 cursor-pointer select-none">
            <input type="checkbox" checked={config.useDate}
              onChange={(event) => onChange({ ...config, useDate: event.target.checked })}
              className="h-4 w-4 accent-emerald-600 border-gray-300 rounded mr-2" />
            รวมปีและเดือน (YYYYMM)
          </label>
        </div>
      </div>
    </section>
  );
}

export default function DocumentNumberSettingsPage() {
  const [rows, setRows] = useState<NumberSettingsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState('');
  const [legacyNotice, setLegacyNotice] = useState(false);
  const [loadedCompanyId, setLoadedCompanyId] = useState('');

  useEffect(() => {
    let active = true;
    let request = 0;
    async function load() {
      const currentRequest = ++request;
      setLoading(true);
      setIsSaved(false);
      setError('');
      setRows([]);
      setLegacyNotice(false);
      try {
        const actor = getDocumentActor();
        const settings = await getDocumentNumberSettings(actor);
        if (!active || request !== currentRequest) return;
        // Old browser-only settings are shown for review; the company database wins.
        let legacy: any = {};
        try { legacy = JSON.parse(localStorage.getItem('me_docflow_document_numbers') || '{}'); } catch {}
        let imported = false;
        const restored = settings.map(row => {
          if (row.saved) return row;
          const normalName = (name: string) => name.split('(')[0].trim().toLowerCase();
          const custom = Array.isArray(legacy.custom) ? legacy.custom.filter((item: any) => typeof item.title === 'string' && normalName(item.title) === normalName(row.title)) : [];
          const oldConfig = custom.length === 1 ? custom[0].config : legacy[row.prefix.toLowerCase()];
          if (!oldConfig) return row;
          imported = true;
          return { ...row, prefix: oldConfig.prefix ?? row.prefix, useDate: oldConfig.useDate ?? row.useDate,
            digits: oldConfig.digits ?? row.digits, startNumber: oldConfig.startNumber ?? row.startNumber };
        });
        setRows(restored);
        setLegacyNotice(imported);
        setLoadedCompanyId(actor.companyId);
      } catch (err) {
        if (active && request === currentRequest) setError(err instanceof Error ? err.message : 'โหลดการตั้งค่าไม่สำเร็จ');
      } finally {
        if (active && request === currentRequest) setLoading(false);
      }
    }
    void load();
    window.addEventListener('activeCompanyChanged', load);
    return () => { active = false; window.removeEventListener('activeCompanyChanged', load); };
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setIsSaved(false);
    try {
      const actor = getDocumentActor();
      if (actor.companyId !== loadedCompanyId) throw new Error('บริษัทมีการเปลี่ยนแปลง กรุณาโหลดหน้าตั้งค่าใหม่');
      const result = await saveDocumentNumberSettings(actor, rows);
      if (!result.success) throw new Error(result.error);
      const savedRows = await getDocumentNumberSettings(actor);
      if (getDocumentActor().companyId !== actor.companyId) return;
      setRows(savedRows);
      setIsSaved(true);
      setLegacyNotice(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกการตั้งค่าไม่สำเร็จ');
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold text-emerald-600 mb-1">การตั้งค่าระบบ</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ตั้งค่าเลขรันเอกสาร</h1>
        <p className="text-sm text-gray-500">กำหนดคำขึ้นต้น รูปแบบวันที่ และลำดับเลขเอกสารสำหรับเอกสารแต่ละประเภท</p>
      </div>
      {error && <p role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</p>}
      {legacyNotice && <p className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl">นำการตั้งค่าเดิมในเบราว์เซอร์มาแสดงแล้ว กรุณาตรวจสอบและกดบันทึกเพื่อใช้กับบริษัทนี้</p>}
      {isSaved && <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5" /> บันทึกสำเร็จ เอกสารใหม่จะใช้เลขรันตามประเภทที่ตั้งไว้
      </div>}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/40 flex items-center gap-3">
          <Hash className="w-6 h-6 text-emerald-700" />
          <div>
            <h2 className="font-semibold text-gray-900">รูปแบบเลขที่เอกสาร</h2>
            <p className="text-xs text-gray-500 mt-1">การเปลี่ยนแปลงมีผลกับเอกสารใหม่หลังบันทึก เลขที่ออกแล้วจะคงเดิมและไม่รันซ้ำ</p>
            <p className="text-xs text-gray-500 mt-1">รวมปีและเดือน: เริ่มเลขรันใหม่ทุกเดือน • ไม่รวมวันที่: รันต่อเนื่อง</p>
          </div>
        </div>
        <fieldset disabled={loading || saving} className="divide-y divide-gray-200">
          {loading ? <p className="p-6 text-gray-500">กำลังโหลดการตั้งค่า...</p> : rows.length === 0 ? <p className="p-6 text-gray-500">ไม่พบประเภทเอกสารที่ตั้งค่าได้</p> : rows.map(row => (
            <DocumentConfigRow key={row.documentTypeId} title={row.title} description={'กำหนดเลขรันสำหรับ' + row.title} config={row}
              onChange={config => { setIsSaved(false); setRows(current => current.map(item => item.documentTypeId === row.documentTypeId ? { ...item, ...config } : item)); }} />
          ))}
        </fieldset>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/40 flex justify-end">
          <button type="submit" disabled={loading || saving || !rows.length} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold py-2.5 px-5 rounded-lg">
            <Save className="w-4 h-4" /> {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าเลขเอกสาร'}
          </button>
        </div>
      </form>
    </div>
  );
}
