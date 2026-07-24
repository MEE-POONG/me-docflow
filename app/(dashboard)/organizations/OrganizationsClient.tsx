'use client';

import { useState, useTransition } from 'react';
import { Plus, Edit2, Trash2, X, Search, Loader2, Filter, FileText } from 'lucide-react';
import { createPartner, updatePartner, deletePartner } from './actions';

type Partner = {
  id: string;
  type: 'CUSTOMER' | 'VENDOR';
  name: string;
  taxId: string | null;
  branchCode: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  contactName: string | null;
  contactPhone: string | null;
};

export default function OrganizationsClient({ initialPartners }: { initialPartners: Partner[] }) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    type: 'CUSTOMER' as 'CUSTOMER' | 'VENDOR',
    name: '',
    taxId: '',
    branchCode: '',
    email: '',
    phone: '',
    address: '',
    contactName: '',
    contactPhone: '',
  });

  const filteredPartners = partners.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenModal = (partner?: Partner) => {
    if (partner) {
      setEditingId(partner.id);
      setFormData({
        type: partner.type,
        name: partner.name,
        taxId: partner.taxId || '',
        branchCode: partner.branchCode || '',
        email: partner.email || '',
        phone: partner.phone || '',
        address: partner.address || '',
        contactName: partner.contactName || '',
        contactPhone: partner.contactPhone || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        type: 'CUSTOMER',
        name: '',
        taxId: '',
        branchCode: '',
        email: '',
        phone: '',
        address: '',
        contactName: '',
        contactPhone: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        if (editingId) {
          await updatePartner(editingId, formData);
        } else {
          await createPartner(formData);
        }
        window.location.reload();
      } catch (error) {
        console.error('Failed to save partner', error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? (Are you sure you want to delete this?)')) {
      startTransition(async () => {
        try {
          await deletePartner(id);
          setPartners(partners.filter(p => p.id !== id));
        } catch (error) {
          console.error('Failed to delete partner', error);
        }
      });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto py-8">
      
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-bold text-teal-700 tracking-wider mb-1">
          COMPANY WORKSPACE
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          ลูกค้า / คู่ค้า
        </h1>
        <p className="text-sm text-gray-500">
          จัดการ CUSTOMER/VENDOR และเอกสารที่เกี่ยวข้อง
        </p>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาลูกค้า / คู่ค้า"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-colors"
          />
        </div>
        
        <select className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 bg-white focus:outline-none focus:border-gray-300">
          <option>CUSTOMER / VENDOR</option>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="VENDOR">VENDOR</option>
        </select>
        
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Bulk Actions Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 bg-white shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> เพิ่มลูกค้า
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 bg-white shadow-sm transition-colors">
          <Edit2 className="w-4 h-4" /> แก้ไขลูกค้า
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 bg-white shadow-sm transition-colors">
          <Trash2 className="w-4 h-4" /> ลบลูกค้า
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 bg-white shadow-sm transition-colors">
          <FileText className="w-4 h-4" /> ดูเอกสารที่เกี่ยวข้อง
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-5 font-normal">ชื่อ</th>
                <th className="px-6 py-5 font-normal">ประเภท</th>
                <th className="px-6 py-5 font-normal">TAX ID</th>
                <th className="px-6 py-5 font-normal">สาขา</th>
                <th className="px-6 py-5 font-normal">อีเมล</th>
                <th className="px-6 py-5 font-normal">เบอร์โทร</th>
                <th className="px-6 py-5 font-normal">ที่อยู่</th>
                <th className="px-6 py-5 font-normal">ผู้ติดต่อ</th>
                <th className="px-6 py-5 font-normal">เอกสาร</th>
                <th className="px-6 py-5 font-normal">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                    ยังไม่มีข้อมูลลูกค้า/คู่ค้า กดปุ่ม "เพิ่มลูกค้า" เพื่อเริ่มต้น
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">{partner.name}</td>
                    <td className="px-6 py-4 text-gray-500">{partner.type}</td>
                    <td className="px-6 py-4 text-gray-500">{partner.taxId || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{partner.branchCode || '00000'}</td>
                    <td className="px-6 py-4 text-gray-500">{partner.email || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{partner.phone || '-'}</td>
                    <td className="px-6 py-4 text-gray-500 max-w-[200px] truncate" title={partner.address || ''}>
                      {partner.address || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {partner.contactName ? (
                        <span>
                          {partner.contactName} {partner.contactPhone && <span className="text-gray-400">{partner.contactPhone}</span>}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">-</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(partner)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(partner.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                {editingId ? 'แก้ไขข้อมูลลูกค้า / คู่ค้า' : 'เพิ่มข้อมูลลูกค้า / คู่ค้า'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">ประเภท (Type)</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'CUSTOMER' | 'VENDOR' })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors text-sm bg-white text-gray-700"
                  >
                    <option value="CUSTOMER">Customer (ลูกค้า)</option>
                    <option value="VENDOR">Vendor (คู่ค้า)</option>
                  </select>
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">ชื่อบริษัท / ชื่อลูกค้า *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors text-sm text-gray-700"
                    placeholder="ระบุชื่อ"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">เลขประจำตัวผู้เสียภาษี (TAX ID)</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors text-sm text-gray-700"
                    placeholder="เลข 13 หลัก"
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">รหัสสาขา</label>
                  <input
                    type="text"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors text-sm text-gray-700"
                    placeholder="เช่น 00000"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors text-sm text-gray-700"
                    placeholder="02-xxx-xxxx"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">อีเมล</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors text-sm text-gray-700"
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700">ที่อยู่</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors text-sm text-gray-700 resize-none"
                    rows={2}
                    placeholder="รายละเอียดที่อยู่"
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">ชื่อผู้ติดต่อ</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors text-sm text-gray-700"
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700">เบอร์โทรผู้ติดต่อ</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors text-sm text-gray-700"
                    placeholder="เบอร์มือถือ"
                  />
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
