"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, FileText, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { th, enUS } from 'date-fns/locale'
import DocumentActions from './DocumentActions'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function DocumentsList({ initialDocuments }: { initialDocuments: any[] }) {
  const [documents, setDocuments] = useState<any[]>(initialDocuments)
  const { t, language } = useLanguage()
  const dateLocale = language === 'en' ? enUS : th

  useEffect(() => {
    // Use all initial documents without hardcoded email filtering
    setDocuments(initialDocuments)
  }, [initialDocuments])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> {t.documentsList.statusApproved}</span>
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"><XCircle className="w-3.5 h-3.5" /> {t.documentsList.statusRejected}</span>
      case 'PENDING':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock className="w-3.5 h-3.5" /> {t.documentsList.statusPending}</span>
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">{t.documentsList.statusDraft}</span>
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto pb-20 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="text-xs font-bold text-emerald-600 dark:text-emerald-500 tracking-wider mb-1 uppercase">
            {t.common.companyWorkspace}
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            {t.documentsList.title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.documentsList.subtitle}
          </p>
        </div>

        <Link
          href="/documents/create"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          {t.documentsList.createNew}
        </Link>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Filters Bar */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t.documentsList.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="flex items-center gap-3">
            <select className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors">
              <option value="">{t.common.allStatus}</option>
              <option value="PENDING">{t.documentsList.statusPending}</option>
              <option value="APPROVED">{t.documentsList.statusApproved}</option>
              <option value="REJECTED">{t.documentsList.statusRejected}</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors text-sm font-medium">
              <Filter className="w-4 h-4" />
              {t.documentsList.filter}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/30">
              <tr>
                <th className="px-6 py-4 font-normal">{t.documentsList.colDocNo}</th>
                <th className="px-6 py-4 font-normal">{t.documentsList.colTitle}</th>
                <th className="px-6 py-4 font-normal">{t.documentsList.colCategory}</th>
                <th className="px-6 py-4 font-normal">{t.common.status}</th>
                <th className="px-6 py-4 font-normal">{t.documentsList.colCreatedBy}</th>
                <th className="px-6 py-4 font-normal">{t.documentsList.colCreatedAt}</th>
                <th className="px-6 py-4 font-normal text-right">{t.common.manage}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-base font-medium">{t.documentsList.emptyTitle}</p>
                    <p className="text-sm mt-1">{t.documentsList.emptyHint}</p>
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      <Link href={`/documents/${doc.id}`} className="hover:underline">{doc.documentNo}</Link>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      <Link href={`/documents/${doc.id}`} className="hover:underline">{doc.title}</Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {doc.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(doc.status)}
                      {/*รอแก้ไข ถ้า ไม่อนุมิต ให้ โชว์ Rejected Reason ในหมายเหตุ */}
                      {/* <p className="text-xs text-red-500 dark:text-red-400 mt-1">ห้ามใช้</p> */}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {doc.createdBy?.name}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(doc.createdAt), 'dd MMM yyyy', { locale: dateLocale })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DocumentActions id={doc.id} title={doc.title} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
