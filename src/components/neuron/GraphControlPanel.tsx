import { useRef } from 'react'
import {
  LayoutGrid,
  Download,
  Upload,
  RotateCcw,
  Maximize2,
  Image,
  Eye,
  EyeOff,
  Pause,
  Play,
} from 'lucide-react'
import type { GraphLayoutId } from '../../lib/graphLayouts'
import { LAYOUT_LABELS } from '../../lib/graphLayouts'

export interface GraphPanelSettings {
  layout: GraphLayoutId
  showBurst: boolean
  showSunLinks: boolean
  labelsAlways: boolean
  animationPaused: boolean
}

interface GraphControlPanelProps {
  settings: GraphPanelSettings
  onSettingsChange: (patch: Partial<GraphPanelSettings>) => void
  onResetView: () => void
  onFitView: () => void
  onExportJson: () => void
  onImportJson: (file: File) => void
  onExportPng: () => void
}

function ToggleRow({
  label,
  on,
  onToggle,
}: {
  label: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/5"
    >
      {label}
      {on ? <Eye size={14} className="text-cyan-400" /> : <EyeOff size={14} className="text-slate-500" />}
    </button>
  )
}

export default function GraphControlPanel({
  settings,
  onSettingsChange,
  onResetView,
  onFitView,
  onExportJson,
  onImportJson,
  onExportPng,
}: GraphControlPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="absolute right-4 top-4 z-20 flex max-w-[280px] flex-col gap-2 sm:right-6 sm:top-6">
      <div className="rounded-2xl border border-white/10 bg-black/75 p-3 backdrop-blur-xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
          <LayoutGrid size={14} />
          Graph controls
        </p>

        <label className="mb-1 block text-[10px] text-slate-400">Layout</label>
        <select
          value={settings.layout}
          onChange={(e) => onSettingsChange({ layout: e.target.value as GraphLayoutId })}
          className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none focus:border-violet-500/50"
        >
          {(Object.keys(LAYOUT_LABELS) as GraphLayoutId[]).map((id) => (
            <option key={id} value={id} className="bg-zinc-900">
              {LAYOUT_LABELS[id]}
            </option>
          ))}
        </select>

        <div className="mb-3 space-y-0.5 border-t border-white/10 pt-2">
          <ToggleRow
            label="Hub burst lines"
            on={settings.showBurst}
            onToggle={() => onSettingsChange({ showBurst: !settings.showBurst })}
          />
          <ToggleRow
            label="Sun connector rays"
            on={settings.showSunLinks}
            onToggle={() => onSettingsChange({ showSunLinks: !settings.showSunLinks })}
          />
          <ToggleRow
            label="Always show labels"
            on={settings.labelsAlways}
            onToggle={() => onSettingsChange({ labelsAlways: !settings.labelsAlways })}
          />
          <button
            type="button"
            onClick={() => onSettingsChange({ animationPaused: !settings.animationPaused })}
            className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/5"
          >
            {settings.animationPaused ? 'Resume motion' : 'Pause motion'}
            {settings.animationPaused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-1.5 border-t border-white/10 pt-2">
          <button
            type="button"
            onClick={onResetView}
            className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-300 hover:bg-white/10"
          >
            <RotateCcw size={12} /> Reset
          </button>
          <button
            type="button"
            onClick={onFitView}
            className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-300 hover:bg-white/10"
          >
            <Maximize2 size={12} /> Fit
          </button>
          <button
            type="button"
            onClick={onExportJson}
            className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-300 hover:bg-white/10"
          >
            <Download size={12} /> Export
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] text-slate-300 hover:bg-white/10"
          >
            <Upload size={12} /> Import
          </button>
          <button
            type="button"
            onClick={onExportPng}
            className="col-span-2 flex items-center justify-center gap-1 rounded-lg border border-violet-500/30 bg-violet-600/20 px-2 py-1.5 text-[10px] text-violet-200 hover:bg-violet-600/30"
          >
            <Image size={12} /> Save as PNG
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onImportJson(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
