import { useState } from 'react'
import './App.css'
import Timeline from './components/Timeline'
import OrizontalTimeline from './components/OrizontalTimeline'
import { Button } from './components/ui/button'

const doctors = [
  { id: 'me2508-00001', name: 'Dr. Ion Martin' },
  { id: 'me2508-00002', name: 'Dr. Ana Pop' },
  { id: 'me2508-00003', name: 'Dr. Elena Vasilescu' },
  { id: 'me2508-00004', name: 'Dr. Andrei Constantinescu' },
  { id: 'me2508-00005', name: 'Dr. Mihai Georgescu' },
  { id: 'me2508-00006', name: 'Dr. Carmen Dumitrescu' },
]

const sampleAppointments = [
  // Programări 01 Octombrie 2025
  {
    id: 'ap2510-00001',
    date: '2025-10-01',
    time: '07:30',
    treatmentType: 'Consultație',
    doctor: { id: 'me2508-00001', name: 'Dr. Ion Martin' },
    patient: { id: 'pa2510-00001', name: 'Vasile Popescu' },
    service: { id: 'tr2510-00001', name: 'Consultație', duration: '30' },
  },
  {
    id: 'ap2510-00002',
    date: '2025-10-01',
    time: '08:05',
    treatmentType: 'Extracție dinte monoradicular',
    doctor: { id: 'me2508-00001', name: 'Dr. Ion Martin' },
    patient: { id: 'pa2510-00002', name: 'Dimitrie Sozlov' },
    service: { id: 'tr2510-00002', name: 'Extracție dinte monoradicular', duration: '30' },
  },
  {
    id: 'ap2510-00003',
    date: '2025-10-01',
    time: '09:00',
    treatmentType: 'Consultație',
    doctor: { id: 'me2508-00002', name: 'Dr. Ana Pop' },
    patient: { id: 'pa2510-00003', name: 'Maria Ionescu' },
    service: { id: 'tr2510-00003', name: 'Consultație', duration: '30' },
  },
  {
    id: 'ap2510-00004',
    date: '2025-10-01',
    time: '10:00',
    treatmentType: 'Detartraj',
    doctor: { id: 'me2508-00002', name: 'Dr. Ana Pop' },
    patient: { id: 'pa2510-00004', name: 'Alexandru Petre' },
    service: { id: 'tr2510-00004', name: 'Detartraj', duration: '45' },
  },
  {
    id: 'ap2510-00005',
    date: '2025-10-01',
    time: '08:00',
    treatmentType: 'Obturație',
    doctor: { id: 'me2508-00003', name: 'Dr. Elena Vasilescu' },
    patient: { id: 'pa2510-00005', name: 'Ioana Munteanu' },
    service: { id: 'tr2510-00005', name: 'Obturație', duration: '60' },
  },
  {
    id: 'ap2510-00006',
    date: '2025-10-01',
    time: '11:30',
    treatmentType: 'Control post-tratament',
    doctor: { id: 'me2508-00003', name: 'Dr. Elena Vasilescu' },
    patient: { id: 'pa2510-00006', name: 'Cristian Moldovan' },
    service: { id: 'tr2510-00006', name: 'Control post-tratament', duration: '20' },
  },
  {
    id: 'ap2510-00007',
    date: '2025-10-01',
    time: '09:30',
    treatmentType: 'Extracție molari',
    doctor: { id: 'me2508-00004', name: 'Dr. Andrei Constantinescu' },
    patient: { id: 'pa2510-00007', name: 'Gabriel Stan' },
    service: { id: 'tr2510-00007', name: 'Extracție molari', duration: '45' },
  },
  {
    id: 'ap2510-00008',
    date: '2025-10-01',
    time: '13:00',
    treatmentType: 'Consultație ortodontică',
    doctor: { id: 'me2508-00005', name: 'Dr. Mihai Georgescu' },
    patient: { id: 'pa2510-00008', name: 'Sofia Radu' },
    service: { id: 'tr2510-00008', name: 'Consultație ortodontică', duration: '40' },
  },
  {
    id: 'ap2510-00009',
    date: '2025-10-01',
    time: '15:00',
    treatmentType: 'Montare aparat ortodontic',
    doctor: { id: 'me2508-00005', name: 'Dr. Mihai Georgescu' },
    patient: { id: 'pa2510-00009', name: 'David Gheorghe' },
    service: { id: 'tr2510-00009', name: 'Montare aparat ortodontic', duration: '90' },
  },
  {
    id: 'ap2510-00010',
    date: '2025-10-01',
    time: '10:00',
    treatmentType: 'Implant dentar',
    doctor: { id: 'me2508-00006', name: 'Dr. Carmen Dumitrescu' },
    patient: { id: 'pa2510-00010', name: 'Laura Nistor' },
    service: { id: 'tr2510-00010', name: 'Implant dentar', duration: '120' },
  },
  {
    id: 'ap2510-00011',
    date: '2025-10-01',
    time: '14:00',
    treatmentType: 'Consultație',
    doctor: { id: 'me2508-00006', name: 'Dr. Carmen Dumitrescu' },
    patient: { id: 'pa2510-00011', name: 'Adrian Stoica' },
    service: { id: 'tr2510-00011', name: 'Consultație', duration: '30' },
  },
  
  // Programări 02 Octombrie 2025
  {
    id: 'ap2510-00012',
    date: '2025-10-02',
    time: '08:00',
    treatmentType: 'Tratament canal radicular',
    doctor: { id: 'me2508-00001', name: 'Dr. Ion Martin' },
    patient: { id: 'pa2510-00012', name: 'Andreea Barbu' },
    service: { id: 'tr2510-00012', name: 'Tratament canal radicular', duration: '90' },
  },
  {
    id: 'ap2510-00013',
    date: '2025-10-02',
    time: '11:00',
    treatmentType: 'Detartraj',
    doctor: { id: 'me2508-00002', name: 'Dr. Ana Pop' },
    patient: { id: 'pa2510-00013', name: 'Florin Ciobanu' },
    service: { id: 'tr2510-00013', name: 'Detartraj', duration: '45' },
  },
  {
    id: 'ap2510-00014',
    date: '2025-10-02',
    time: '09:00',
    treatmentType: 'Obturație',
    doctor: { id: 'me2508-00003', name: 'Dr. Elena Vasilescu' },
    patient: { id: 'pa2510-00014', name: 'Raluca Ungureanu' },
    service: { id: 'tr2510-00014', name: 'Obturație', duration: '60' },
  },
  {
    id: 'ap2510-00015',
    date: '2025-10-02',
    time: '13:30',
    treatmentType: 'Consultație',
    doctor: { id: 'me2508-00004', name: 'Dr. Andrei Constantinescu' },
    patient: { id: 'pa2510-00015', name: 'Marius Luca' },
    service: { id: 'tr2510-00015', name: 'Consultație', duration: '30' },
  },
  {
    id: 'ap2510-00016',
    date: '2025-10-02',
    time: '16:00',
    treatmentType: 'Ajustare aparat ortodontic',
    doctor: { id: 'me2508-00005', name: 'Dr. Mihai Georgescu' },
    patient: { id: 'pa2510-00016', name: 'Elena Dobre' },
    service: { id: 'tr2510-00016', name: 'Ajustare aparat ortodontic', duration: '30' },
  },
  {
    id: 'ap2510-00017',
    date: '2025-10-02',
    time: '10:30',
    treatmentType: 'Coroane dentare',
    doctor: { id: 'me2508-00006', name: 'Dr. Carmen Dumitrescu' },
    patient: { id: 'pa2510-00017', name: 'Bogdan Marinescu' },
    service: { id: 'tr2510-00017', name: 'Coroane dentare', duration: '120' },
  },
  
  // Programări 03 Octombrie 2025
  {
    id: 'ap2510-00018',
    date: '2025-10-03',
    time: '07:30',
    treatmentType: 'Consultație urgentă',
    doctor: { id: 'me2508-00001', name: 'Dr. Ion Martin' },
    patient: { id: 'pa2510-00018', name: 'Diana Popa' },
    service: { id: 'tr2510-00018', name: 'Consultație urgentă', duration: '20' },
  },
  {
    id: 'ap2510-00019',
    date: '2025-10-03',
    time: '10:00',
    treatmentType: 'Albire dentară',
    doctor: { id: 'me2508-00002', name: 'Dr. Ana Pop' },
    patient: { id: 'pa2510-00019', name: 'Simona Rusu' },
    service: { id: 'tr2510-00019', name: 'Albire dentară', duration: '60' },
  },
  {
    id: 'ap2510-00020',
    date: '2025-10-03',
    time: '12:00',
    treatmentType: 'Extracție',
    doctor: { id: 'me2508-00003', name: 'Dr. Elena Vasilescu' },
    patient: { id: 'pa2510-00020', name: 'Constantin Filip' },
    service: { id: 'tr2510-00020', name: 'Extracție', duration: '30' },
  },
  {
    id: 'ap2510-00021',
    date: '2025-10-03',
    time: '14:30',
    treatmentType: 'Obturație',
    doctor: { id: 'me2508-00004', name: 'Dr. Andrei Constantinescu' },
    patient: { id: 'pa2510-00021', name: 'Gabriela Ionescu' },
    service: { id: 'tr2510-00021', name: 'Obturație', duration: '45' },
  },
  {
    id: 'ap2510-00022',
    date: '2025-10-03',
    time: '09:00',
    treatmentType: 'Consultație ortodontică',
    doctor: { id: 'me2508-00005', name: 'Dr. Mihai Georgescu' },
    patient: { id: 'pa2510-00022', name: 'Victor Matei' },
    service: { id: 'tr2510-00022', name: 'Consultație ortodontică', duration: '40' },
  },
  {
    id: 'ap2510-00023',
    date: '2025-10-03',
    time: '11:00',
    treatmentType: 'Consultație implant',
    doctor: { id: 'me2508-00006', name: 'Dr. Carmen Dumitrescu' },
    patient: { id: 'pa2510-00023', name: 'Monica Tudor' },
    service: { id: 'tr2510-00023', name: 'Consultație implant', duration: '45' },
  },
]

function App() {
  const [day, setDay] = useState('2025-10-01')
  const [viewMode, setViewMode] = useState('vertical') // 'vertical' sau 'horizontal'

  return (
    <div className="flex h-screen flex-col">
      {/* Meniu de selecție vizualizare */}
      <div className="flex items-center justify-center gap-2 border-b bg-white px-4 py-3">
        <span className="text-sm font-medium text-slate-700 mr-2">Mod vizualizare:</span>
        <Button
          variant={viewMode === 'vertical' ? 'default' : 'outline'}
          onClick={() => setViewMode('vertical')}
        >
          Vizualizare Verticală (Zilnică)
        </Button>
        <Button
          variant={viewMode === 'horizontal' ? 'default' : 'outline'}
          onClick={() => setViewMode('horizontal')}
        >
          Vizualizare Orizontală (Săptămânală)
        </Button>
      </div>

      {/* Container pentru timeline-ul selectat */}
      <div className="flex-1 overflow-hidden outline outline-2 outline-black-500 rounded-md">
        {viewMode === 'vertical' ? (
          <Timeline
            date={day}
            appointments={sampleAppointments}
            doctors={doctors}
            onDateChange={setDay}
          />
        ) : (
          <OrizontalTimeline
            startDate={day}
            numDays={7}
            appointments={sampleAppointments}
            doctors={doctors}
          />
        )}
      </div>
    </div>
  )
}

export default App
