'use client';

import { useState, useTransition, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Loader2, Filter, FileText } from 'lucide-react';
import { createPartner, updatePartner, deletePartner, getPartners } from './actions';

import { useLanguage } from '@/lib/i18n/LanguageContext';

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
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  
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

  useEffect(() => {
    const fetchMyPartners = async () => {
      const userStr = localStorage.getItem("me_docflow_current_user");
      let currentEmail = "melisara@siamretail.co.th";
      if (userStr) {
        try {
          const u = JSON.parse(userStr);
          if (u.email) currentEmail = u.email;
        } catch (e) {}
      }
      try {
        const myPartners = await getPartners(currentEmail);
        setPartners(myPartners as any);
      } catch (err) {
        setPartners(initialPartners);
      }
    };
    fetchMyPartners();
  }, [initialPartners]);

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
        const userStr = localStorage.getItem("me_docflow_current_user");
        let currentEmail = "melisara@siamretail.co.th";
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            if (u.email) currentEmail = u.email;
          } catch (e) {}
        }

        if (editingId) {
          await updatePartner(editingId, currentEmail, { ...formData, partnerEmail: formData.email });
        } else {
          await createPartner(currentEmail, { ...formData, partnerEmail: formData.email });
        }
        
        // Refetch partners after mutation to update the list locally
        const myPartners = await getPartners(currentEmail);
        setPartners(myPartners as any);
        
        setIsModalOpen(false);
      } catch (error) {
        console.error('Failed to save partner', error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm(t.organizations.confirmDelete)) {
      startTransition(async () => {
        const userStr = localStorage.getItem("me_docflow_current_user");
        let currentEmail = "melisara@siamretail.co.th";
        if (userStr) {
          try {
            const u = JSON.parse(userStr);
            if (u.email) currentEmail = u.email;
          } catch (e) {}
        }
        await deletePartner(id, currentEmail);
        
        const myPartners = await getPartners(currentEmail);
        setPartners(myPartners as any);
      });
    }
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto py-8">
      
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-bold text-teal-700 dark:text-teal-500 tracking-wider mb-1">
          {t.common.companyWorkspace}
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
          {t.organizations.title}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.organizations.subtitle}
        </p>
      </div>

      {/* Toolbar / Search & Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6 flex flex-wrap items-center gap-4 transition-colors">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.organizations.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 focus:ring-1 focus:ring-gray-200 dark:focus:ring-gray-600 transition-colors"
          />
        </div>
        
        <select className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-300 dark:focus:border-gray-500 transition-colors">
          <option>{t.organizations.filterPlaceholder}</option>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="VENDOR">VENDOR</option>
        </select>
        
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Bulk Actions Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> {t.organizations.addCustomer}
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-colors">
          <Edit2 className="w-4 h-4" /> {t.organizations.editCustomer}
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-colors">
          <Trash2 className="w-4 h-4" /> {t.organizations.deleteCustomer}
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-colors">
          <FileText className="w-4 h-4" /> {t.organizations.viewDocuments}
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead className="text-gray-500 dark:text-gray-400 font-medium">
              <tr>
                <th className="px-3 py-3 font-normal">{t.organizations.colName}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.organizations.colType}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.organizations.colTaxId}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.organizations.colBranch}</th>
                <th className="px-3 py-3 font-normal">{t.organizations.colEmail}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.organizations.colPhone}</th>
                <th className="px-3 py-3 font-normal">{t.organizations.colAddress}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.organizations.colContact}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.organizations.colDocs}</th>
                <th className="px-3 py-3 font-normal whitespace-nowrap">{t.common.manage}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-gray-400 dark:text-gray-500">
                    {t.organizations.empty}
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-3 py-3 min-w-[120px]">{partner.name}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{partner.type}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{partner.taxId || '-'}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{partner.branchCode || '00000'}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 break-all min-w-[140px]">{partner.email || '-'}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">{partner.phone || '-'}</td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={partner.address || ''}>
                      {partner.address || '-'}
                    </td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 min-w-[120px]">
                      {partner.contactName ? (
                        <span>
                          {partner.contactName} {partner.contactPhone && <span className="text-gray-400 dark:text-gray-500 block text-xs">{partner.contactPhone}</span>}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">-</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenModal(partner)}
                          className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" /> {t.common.edit}
                        </button>
                        <button
                          onClick={() => handleDelete(partner.id)}
                          className="flex items-center gap-1.5 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />} {t.common.delete}
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 transition-colors">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                {editingId ? t.organizations.modalEditTitle : t.organizations.modalAddTitle}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.organizations.colType}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'CUSTOMER' | 'VENDOR' })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                  >
                    <option value="CUSTOMER">Customer ({t.organizations.typeCustomer})</option>
                    <option value="VENDOR">Vendor ({t.organizations.typeVendor})</option>
                  </select>
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.organizations.colName} *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.organizations.colTaxId}</label>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.organizations.colBranch}</label>
                  <input
                    type="text"
                    value={formData.branchCode}
                    onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.organizations.colPhone}</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.organizations.colEmail}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.organizations.colAddress}</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors text-sm text-gray-700 dark:text-gray-200 resize-none"
                    rows={2}
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.organizations.colContact}</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.organizations.colPhone} (Contact)</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors text-sm text-gray-700 dark:text-gray-200"
                  />
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t.organizations.btnCancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? t.common.save : t.organizations.btnSave}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
