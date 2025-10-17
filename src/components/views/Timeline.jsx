import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '../../lib/utils'

const START_HOUR = 7
const END_HOUR = 21
const HEADER_HEIGHT = 44

function parseTimeToMinutes(timeStr) {
  const [hh, mm] = timeStr.split(':').map(Number)
  return hh * 60 + mm
}

function formatHour(h) {
  return `${String(h).padStart(2, '0')}:00`
}

export default function Timeline({ date, appointments = [], doctors = [], onDateChange, onAppointmentClick }) {
  const [activeDate, setActiveDate] = useState(date || new Date().toISOString().slice(0, 10))
  const [openSheet, setOpenSheet] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState(null)

  useEffect(() => {
    if (date) setActiveDate(date)
  }, [date])

  // Layout sizing
  const [layout, setLayout] = useState({ baseHourHeight: 60, timeColWidth: 90, colWidth: 280 })
  const zoom = 4

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth
      if (w >= 1280) setLayout({ baseHourHeight: 60, timeColWidth: 96, colWidth: 300 })
      else if (w >= 768) setLayout({ baseHourHeight: 56, timeColWidth: 90, colWidth: 280 })
      else setLayout({ baseHourHeight: 52, timeColWidth: 84, colWidth: 250 })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const hourHeight = Math.round(layout.baseHourHeight * zoom)
  const minuteHeight = hourHeight / 60
  const dayMinutes = (END_HOUR - START_HOUR) * 60
  const contentHeight = Math.round(dayMinutes * minuteHeight)

  const timelineStart = START_HOUR * 60
  const timelineEnd = END_HOUR * 60

  // Drag-to-scroll
  const containerRef = useRef(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const scrollTopRef = useRef(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onMouseDown = (e) => {
      isDraggingRef.current = true
      startXRef.current = e.pageX - el.offsetLeft
      startYRef.current = e.pageY - el.offsetTop
      scrollLeftRef.current = el.scrollLeft
      scrollTopRef.current = el.scrollTop
      el.classList.add('cursor-grabbing')
    }
    const onMouseLeave = () => {
      isDraggingRef.current = false
      el.classList.remove('cursor-grabbing')
    }
    const onMouseUp = () => {
      isDraggingRef.current = false
      el.classList.remove('cursor-grabbing')
    }
    const onMouseMove = (e) => {
      if (!isDraggingRef.current) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      const y = e.pageY - el.offsetTop
      el.scrollLeft = scrollLeftRef.current - (x - startXRef.current)
      el.scrollTop = scrollTopRef.current - (y - startYRef.current)
    }
    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mouseleave', onMouseLeave)
    el.addEventListener('mouseup', onMouseUp)
    el.addEventListener('mousemove', onMouseMove)
    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mouseleave', onMouseLeave)
      el.removeEventListener('mouseup', onMouseUp)
      el.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  // Touch
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onTouchStart = (e) => {
      isDraggingRef.current = true
      startXRef.current = e.touches[0].pageX - el.offsetLeft
      startYRef.current = e.touches[0].pageY - el.offsetTop
      scrollLeftRef.current = el.scrollLeft
      scrollTopRef.current = el.scrollTop
    }
    const onTouchEnd = () => {
      isDraggingRef.current = false
    }
    const onTouchMove = (e) => {
      if (!isDraggingRef.current) return
      const x = e.touches[0].pageX - el.offsetLeft
      const y = e.touches[0].pageY - el.offsetTop
      el.scrollLeft = scrollLeftRef.current - (x - startXRef.current)
      el.scrollTop = scrollTopRef.current - (y - startYRef.current)
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [])

  const handleDateChange = (e) => {
    const newDate = e.target.value
    setActiveDate(newDate)
    onDateChange?.(newDate)
  }

  const apptsForDate = useMemo(() => appointments.filter(a => (a?.date || a?.appointmentDate) === activeDate), [appointments, activeDate])

  const doctorIdToAppts = useMemo(() => {
    const map = new Map()
    for (const doc of doctors) map.set(doc.id, [])
    for (const a of apptsForDate) {
      const docId = a?.doctor?.id
      if (!docId) continue
      if (!map.has(docId)) map.set(docId, [])
      map.get(docId).push(a)
    }
    for (const [k, list] of map.entries()) {
      list.sort((x, y) => parseTimeToMinutes(x.time || x.startTime) - parseTimeToMinutes(y.time || y.startTime))
    }
    return map
  }, [apptsForDate, doctors])

  function onOpenDetails(appt) {
    setSelectedAppt(appt)
    setOpenSheet(true)
    // Dacă există un callback extern, îl apelăm
    onAppointmentClick?.(appt)
  }

  const isTouchDevice = typeof window !== 'undefined' && (('ontouchstart' in window) || (navigator?.maxTouchPoints > 0))

  const hours = useMemo(() => {
    const arr = []
    for (let h = START_HOUR; h < END_HOUR; h++) arr.push(h)
    return arr
  }, [])

  return (
    <div className="flex h-full w-full flex-col rounded-lg overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        {/* Mesaj când nu există programări */}
        {apptsForDate.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-slate-600 text-lg">Nu aveți programări în această zi</p>
              <p className="text-slate-400 text-sm mt-2">Selectați altă dată sau adăugați o programare nouă</p>
            </div>
          </div>
        ) : (
          <div ref={containerRef} className="absolute inset-0 overflow-auto cursor-grab select-none">
            
            {/* Antetul fix (Doctorii) */}
            <div className="sticky top-0 z-35 flex border-b bg-white" style={{ height: HEADER_HEIGHT, minWidth: layout.timeColWidth + (doctors.length * layout.colWidth) }}>
              <div className="shrink-0 border-r flex items-center justify-center text-xs text-slate-600" style={{ width: layout.timeColWidth }}>Ore</div>
              {doctors.map((doc) => (
                <div key={doc.id} className="shrink-0 flex items-center px-3 text-sm font-medium text-slate-800 border-r" style={{ width: layout.colWidth }}>
                  {doc.name}
                </div>
              ))}
            </div>

            {/* Corpul Calendarului */}
            <div className="relative" style={{ minHeight: contentHeight }}>
            
            {/* Axa de Timp Fixă (Stânga) */}
            <div className="sticky left-0 top-0 z-20 bg-white border-r" style={{ width: layout.timeColWidth }}>
              {hours.map((h) => (
                <div key={h} className="relative flex items-start px-2 text-xs text-slate-600" style={{ height: hourHeight }}>
                  <div className="sticky left-0 top-0 pt-1 font-medium">{formatHour(h)}</div>
                  {/* Linia orizontală principală la începutul orei */}
                  <div className="absolute left-0 right-0 top-0 h-px bg-slate-200" /> 
                  {/* Sferturi de oră */}
                  {[1,2,3].map((q) => (
                    <div key={q} className="absolute left-0 right-0 h-px bg-slate-200/70" style={{ top: Math.round((hourHeight/4)*q) }} />
                  ))}
                </div>
              ))}
            </div>

            {/* Zona Coloanelor de Doctori și Dungilor de Oră */}
            <div className="absolute top-0 left-0 right-0 z-10" style={{ marginLeft: layout.timeColWidth, height: contentHeight, minWidth: doctors.length * layout.colWidth }}>
              
              {/* 1. Dungile de Oră (Fundalul) - Se întind pe toată lățimea */}
              <div className="pointer-events-none absolute inset-0" style={{ minWidth: doctors.length * layout.colWidth }}>
                {hours.map((h, i) => (
                  <div key={h} className={cn('relative border-t', i === 0 ? 'border-slate-200' : 'border-transparent')} style={{ height: hourHeight }}>
                    {/* Sferturi de oră, vizibile pe fundal */}
                    {[1,2,3].map((q) => (
                      <div key={q} className="absolute left-0 right-0 h-px bg-slate-200/70" style={{ top: Math.round((hourHeight/4)*q) }} />
                    ))}
                  </div>
                ))}
              </div>

              {/* 2. Coloanele Medicilor și Programările (Conținutul) - Suprapuse peste dungi */}
              <div className="relative flex h-full">
                {doctors.map((doc) => (
                  <div key={doc.id} className="relative shrink-0 border-r" style={{ width: layout.colWidth }}>
                    {(doctorIdToAppts.get(doc.id) || []).map((a, i) => {
                      const startMin = parseTimeToMinutes(a.time || a.startTime)
                      const durationMin = Number(a?.service?.duration || a?.serviceDuration || 30)
                      const apptStart = startMin
                      const apptEnd = startMin + durationMin
                      const clampedStart = Math.max(apptStart, timelineStart)
                      const clampedEnd = Math.min(apptEnd, timelineEnd)
                      const top = Math.max(0, Math.round((clampedStart - timelineStart) * minuteHeight))
                      const height = Math.max(32, Math.round(Math.max(0, clampedEnd - clampedStart) * minuteHeight))
                      return (
                        <div
                          key={a.id || a.resourceId || i}
                          onDoubleClick={() => onOpenDetails(a)}
                          onClick={isTouchDevice ? () => onOpenDetails(a) : undefined}
                          className="absolute left-2 right-2 rounded-md border bg-white shadow-card transition-shadow hover:shadow-sm hover:ring-1 hover:ring-slate-300 z-10 cursor-pointer outline outline-blue-500"
                          style={{ top, height }}
                        >
                          <div className="grid h-fit grid-rows-3 px-2 py-1 text-xs">
              
                            <div className="truncate font-medium text-slate-900">{a?.patient?.name || a?.patient || 'Pacient'}</div>
                            <div className="truncate text-slate-600">{a?.doctor?.name || a?.doctor || 'Medic'}</div>
                            <div className="flex items-center justify-between text-slate-600">
                              <div className="flex items-center gap-1 truncate">
                                <span className="truncate">{a?.service?.name || a?.service || a?.treatmentType}</span>
                                {/* Indicator pentru servicii suplimentare */}
                                {a.services && a.services.length > 1 && (
                                  <span className="inline-flex items-center justify-center h-4 px-1 rounded-full text-[9px] font-medium bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                                    +{a.services.length - 1}
                                  </span>
                                )}
                              </div>
                              <span className="ml-2 shrink-0 font-mono text-[10px]">{(a.time || a.startTime) ?? ''}</span>
                              </div>
                            </div>
                          </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  )
}

