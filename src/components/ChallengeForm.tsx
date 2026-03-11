'use client'
import { useState } from 'react'
import { Challenge, Category, Difficulty, Hint } from '@/types'
import { DIFFICULTY_BASE_POINTS } from '@/lib/scoring'

const CATEGORIES: Category[] = ['GEN', 'CRYPTO', 'WEB', 'FOR', 'REV', 'MISC']
const DIFFICULTIES: Difficulty[] = ['Easy', 'Medium', 'Hard', 'Expert']

interface FormData {
  title_th: string; title_en: string
  description_th: string; description_en: string
  category: Category; difficulty: Difficulty
  flag_plain: string; hints: Hint[]
  visible: boolean; attachment_url: string
  solution_th: string
}

interface Props {
  challenge?: Challenge
  onSubmit: (data: FormData) => Promise<void>
  saving: boolean
}

export default function ChallengeForm({ challenge, onSubmit, saving }: Props) {
  const [form, setForm] = useState<FormData>({
    title_th: challenge?.title_th || '',
    title_en: challenge?.title_en || '',
    description_th: challenge?.description_th || '',
    description_en: challenge?.description_en || '',
    category: challenge?.category || 'GEN',
    difficulty: challenge?.difficulty || 'Easy',
    flag_plain: '',
    hints: challenge?.hints || [],
    visible: challenge?.visible ?? false,
    attachment_url: challenge?.attachment_url || '',
    solution_th: (challenge as any)?.solution_th || '',
  })

  const set = (k: keyof FormData, v: any) => setForm(f => ({ ...f, [k]: v }))

  const addHint = () => set('hints', [...form.hints, { text_th: '', text_en: '', penalty_pct: 0 }])
  const removeHint = (i: number) => set('hints', form.hints.filter((_, j) => j !== i))
  const updateHint = (i: number, k: keyof Hint, v: any) => {
    const hints = [...form.hints]
    hints[i] = { ...hints[i], [k]: v }
    set('hints', hints)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  const inputCls = 'w-full bg-gray-800 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500'
  const labelCls = 'block text-xs text-gray-400 mb-1'
  const sectionCls = 'bg-gray-900 border border-gray-700 rounded-lg p-5 space-y-4'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Titles */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold text-gray-300">ชื่อโจทย์</h2>
        <div>
          <label className={labelCls}>ชื่อ (TH)</label>
          <input required className={inputCls} value={form.title_th} onChange={e => set('title_th', e.target.value)} placeholder="เช่น ถอดรหัสลับ" />
        </div>
        <div>
          <label className={labelCls}>ชื่อ (EN)</label>
          <input required className={inputCls} value={form.title_en} onChange={e => set('title_en', e.target.value)} placeholder="e.g. Hidden in Plain Sight" />
        </div>
      </div>

      {/* Meta */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold text-gray-300">ประเภท & ระดับ</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Category</label>
            <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Difficulty</label>
            <select className={inputCls} value={form.difficulty} onChange={e => set('difficulty', e.target.value as Difficulty)}>
              {DIFFICULTIES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Base points: <span className="text-cyan-400 font-mono">{DIFFICULTY_BASE_POINTS[form.difficulty]}</span>
        </div>
      </div>

      {/* Description */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold text-gray-300">โจทย์ / Description</h2>
        <div>
          <label className={labelCls}>Description (TH)</label>
          <textarea required rows={4} className={inputCls} value={form.description_th} onChange={e => set('description_th', e.target.value)} placeholder="อธิบายโจทย์ภาษาไทย..." />
        </div>
        <div>
          <label className={labelCls}>Description (EN)</label>
          <textarea required rows={4} className={inputCls} value={form.description_en} onChange={e => set('description_en', e.target.value)} placeholder="Describe the challenge in English..." />
        </div>
        <div>
          <label className={labelCls}>Attachment URL (optional)</label>
          <input className={inputCls} value={form.attachment_url} onChange={e => set('attachment_url', e.target.value)} placeholder="https://..." />
        </div>
      </div>

      {/* Flag */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold text-gray-300">Flag</h2>
        <div>
          <label className={labelCls}>
            Flag (plain text){challenge ? ' — เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน' : ''}
          </label>
          <input
            required={!challenge}
            className={inputCls}
            value={form.flag_plain}
            onChange={e => set('flag_plain', e.target.value)}
            placeholder="flag{...}"
            autoComplete="off"
          />
          <p className="text-xs text-gray-600 mt-1">จะถูก hash ด้วย SHA-256 ก่อนบันทึก</p>
        </div>
      </div>

      {/* Hints */}
      <div className={sectionCls}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-300">คำใบ้ (Hints)</h2>
          <button type="button" onClick={addHint} className="text-xs text-cyan-400 hover:text-cyan-300">+ เพิ่มคำใบ้</button>
        </div>
        {form.hints.length === 0 && <p className="text-xs text-gray-600">ยังไม่มีคำใบ้</p>}
        {form.hints.map((h, i) => (
          <div key={i} className="border border-gray-700 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">คำใบ้ #{i + 1}</span>
              <button type="button" onClick={() => removeHint(i)} className="text-xs text-red-500 hover:text-red-400">ลบ</button>
            </div>
            <input className={inputCls} placeholder="คำใบ้ (TH)" value={h.text_th} onChange={e => updateHint(i, 'text_th', e.target.value)} />
            <input className={inputCls} placeholder="Hint (EN)" value={h.text_en} onChange={e => updateHint(i, 'text_en', e.target.value)} />
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400 whitespace-nowrap">หักคะแนน %</label>
              <input
                type="number" min="0" max="100"
                className={`${inputCls} w-24`}
                value={h.penalty_pct}
                onChange={e => updateHint(i, 'penalty_pct', Number(e.target.value))}
              />
              <span className="text-xs text-gray-500">{h.penalty_pct === 0 ? 'ฟรี' : `-${h.penalty_pct}%`}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Solution */}
      <div className={sectionCls}>
        <h2 className="text-sm font-semibold text-gray-300">เฉลย (Coach only)</h2>
        <textarea rows={4} className={inputCls} value={form.solution_th} onChange={e => set('solution_th', e.target.value)} placeholder="อธิบายวิธีแก้โจทย์ step-by-step..." />
      </div>

      {/* Visibility + Submit */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.visible} onChange={e => set('visible', e.target.checked)} className="accent-cyan-500 w-4 h-4" />
          <span className="text-sm text-gray-300">เปิดให้นักเรียนเห็น</span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-6 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </form>
  )
}
