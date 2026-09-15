'use client'

export default function ProfileError({ reset }: { reset: () => void }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800"><p>ไม่สามารถโหลดโปรไฟล์ได้ กรุณาลองใหม่อีกครั้ง</p><button onClick={reset} className="mt-3 rounded-lg border border-red-300 px-4 py-2">ลองใหม่</button></div>
}
