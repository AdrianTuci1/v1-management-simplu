import { indexedDb, db } from '../data/infrastructure/db.js'

// Utility: random helpers
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function pad(num, size = 5) {
  let s = String(num)
  while (s.length < size) s = '0' + s
  return s
}

function nowIsoMinusDays(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

// Business/location from demo user defaults
const BUSINESS_ID = 'B0100001'
const LOCATION_ID = 'L0100001'

// Seed generators
function generatePatients(count = 50) {
  const firstNames = ['Ion', 'Maria', 'Alexandru', 'Elena', 'Mihai', 'Ana', 'Andrei', 'Cristina', 'Vlad', 'Ioana', 'Radu', 'Diana', 'George', 'Bianca']
  const lastNames = ['Popescu', 'Ionescu', 'Dumitrescu', 'Stoica', 'Munteanu', 'Florescu', 'Dobrescu', 'Constantinescu', 'Marinescu', 'Georgescu']
  const streets = ['Mihai Viteazu', 'Unirii', 'Victoriei', 'Plevnei', 'Dorobanti', 'Titulescu', 'Kogalniceanu']
  const cities = ['București', 'Cluj-Napoca', 'Iași', 'Timișoara', 'Brașov', 'Constanța']
  const counties = ['București', 'Cluj', 'Iași', 'Timiș', 'Brașov', 'Constanța']

  const patients = []
  for (let i = 1; i <= count; i++) {
    const first = pick(firstNames)
    const last = pick(lastNames)
    const name = `${first} ${last}`
    const cityIdx = randomInt(0, cities.length - 1)
    const city = cities[cityIdx]
    const county = counties[cityIdx]
    const birthYear = randomInt(1945, 2015)
    const id = `PAT${pad(i)}`

    patients.push({
      id,
      resourceId: id,
      businessId: BUSINESS_ID,
      locationId: LOCATION_ID,
      patientName: name,
      name, // convenience for indexes and UI
      email: `${first.toLowerCase()}.${last.toLowerCase()}@mail.ro`,
      phone: `07${randomInt(0, 9)}${randomInt(1000000, 9999999)}`,
      gender: Math.random() > 0.5 ? 'male' : 'female',
      birthYear,
      address: `Str. ${pick(streets)} nr. ${randomInt(1, 200)}, ${city}`,
      city,
      county,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      tags: Math.random() > 0.7 ? ['abonat'] : [],
      createdAt: nowIsoMinusDays(randomInt(5, 180)),
      updatedAt: new Date().toISOString()
    })
  }
  return patients
}

function generateUsers(count = 10) {
  const firstNames = ['Dr. Ion', 'Dr. Maria', 'Dr. Alexandru', 'Dr. Elena', 'Dr. Mihai', 'Dr. Ana', 'Dr. Andrei', 'Dr. Cristina']
  const lastNames = ['Popescu', 'Ionescu', 'Dumitrescu', 'Stoica', 'Munteanu', 'Florescu', 'Dobrescu', 'Constantinescu']
  const roles = ['doctor', 'nurse', 'specialist', 'resident', 'admin']
  const dutyDaysOptions = [
    ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'],
    ['Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'],
    ['Luni', 'Miercuri', 'Vineri'],
    ['Luni', 'Marți', 'Joi', 'Vineri']
  ]

  const users = []
  for (let i = 1; i <= count; i++) {
    const first = pick(firstNames)
    const last = pick(lastNames)
    const medicName = `${first} ${last}`
    const role = pick(roles)
    const id = `USR${pad(i)}`
    users.push({
      id,
      resourceId: id,
      businessId: BUSINESS_ID,
      locationId: LOCATION_ID,
      medicName,
      email: `${first.toLowerCase().replace('dr. ', '')}.${last.toLowerCase()}@clinica-demo.ro`,
      phone: `07${randomInt(0, 9)}${randomInt(1000000, 9999999)}`,
      role,
      dutyDays: pick(dutyDaysOptions),
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      createdAt: nowIsoMinusDays(randomInt(10, 365)),
      updatedAt: new Date().toISOString()
    })
  }
  return users
}

function generateTreatments() {
  const templates = [
    ['Consultație stomatologică', 'Consultații', 30, 120],
    ['Detartraj', 'Igienă orală', 45, 180],
    ['Plombă compozită', 'Tratamente conservatoare', 60, 250],
    ['Extracție dinte', 'Chirurgie orală', 30, 350],
    ['Radiografie panoramică', 'Imagini diagnostice', 15, 90],
    ['Tratament canal', 'Endodonție', 90, 600],
    ['Proteză mobilă', 'Protezare', 120, 900],
    ['Implant dentar', 'Implantologie', 180, 2200],
    ['Albire dentară', 'Estetică', 60, 300],
    ['Ortodonție - bracket', 'Ortodonție', 45, 500]
  ]
  return templates.map((t, idx) => {
    const id = `TRT${pad(idx + 1)}`
    return {
      id,
      resourceId: id,
      businessId: BUSINESS_ID,
      locationId: LOCATION_ID,
      treatmentType: t[0],
      category: t[1],
      duration: t[2],
      price: t[3],
      description: '',
      createdAt: nowIsoMinusDays(randomInt(30, 400)),
      updatedAt: new Date().toISOString()
    }
  })
}

function generateProducts() {
  const names = [
    ['Paracetamol 500mg', 'Medicamente', 15.5],
    ['Ibuprofen 400mg', 'Medicamente', 12.8],
    ['Periuță de dinți electrică', 'Dispozitive Medicale', 189.99],
    ['Pastă de dinți cu fluor', 'Produse de Îngrijire', 12.5],
    ['Aparat de tensiune', 'Echipamente', 245.0],
    ['Măști chirurgicale (50)', 'Consumabile', 29.0],
    ['Vitamina C 1000mg', 'Medicamente', 22.9],
    ['Termometru digital', 'Echipamente', 65.5],
    ['Dezinfectant mâini', 'Consumabile', 18.0],
    ['Fir dentar', 'Produse de Îngrijire', 9.5]
  ]
  return names.map((n, idx) => {
    const id = `PROD${pad(idx + 1)}`
    const stock = randomInt(0, 80)
    const reorderLevel = randomInt(5, 20)
    return {
      id,
      resourceId: id,
      businessId: BUSINESS_ID,
      locationId: LOCATION_ID,
      name: n[0],
      category: n[1],
      price: n[2],
      stock,
      reorderLevel,
      createdAt: nowIsoMinusDays(randomInt(20, 200)),
      updatedAt: new Date().toISOString()
    }
  })
}

function formatDateYMD(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function generateAppointments(patients, users, treatments, count = 100) {
  const appointments = []
  const hours = ['09:00', '10:00', '11:30', '13:00', '14:30', '16:00']
  for (let i = 1; i <= count; i++) {
    const id = `APT${pad(i)}`
    const dayOffset = randomInt(-20, 20)
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)
    const patient = pick(patients)
    const doctor = pick(users.filter(u => u.role === 'doctor' || u.role === 'admin'))
    const service = pick(treatments)
    const statusPool = ['scheduled', 'completed', 'in-progress', 'cancelled']
    const status = pick(statusPool)
    appointments.push({
      id,
      resourceId: id,
      businessId: BUSINESS_ID,
      locationId: LOCATION_ID,
      date: formatDateYMD(date),
      time: pick(hours),
      status,
      price: service.price,
      patient: { id: patient.resourceId, name: patient.patientName },
      doctor: { id: doctor.resourceId, name: doctor.medicName },
      service: { id: service.resourceId, name: service.treatmentType, duration: service.duration },
      createdAt: nowIsoMinusDays(randomInt(1, 40)),
      updatedAt: new Date().toISOString()
    })
  }
  return appointments
}

function generateSales(products, count = 60) {
  const paymentMethods = ['cash', 'card', 'tickets', 'receipt']
  const statuses = ['completed', 'completed', 'completed', 'pending', 'cancelled']
  const sales = []
  for (let i = 1; i <= count; i++) {
    const id = `SALE${pad(i)}`
    const itemsCount = randomInt(1, 4)
    const items = []
    let total = 0
    for (let j = 0; j < itemsCount; j++) {
      const p = pick(products)
      const quantity = randomInt(1, 3)
      const price = parseFloat(p.price)
      const itemTotal = price * quantity
      items.push({
        productId: p.resourceId,
        productName: p.name,
        quantity,
        price,
        taxRate: 19,
        total: parseFloat(itemTotal.toFixed(2))
      })
      total += itemTotal
    }
    const tax = total * 0.19
    const subtotal = total
    const createdAt = nowIsoMinusDays(randomInt(0, 30))
    sales.push({
      id,
      resourceId: id,
      businessId: BUSINESS_ID,
      locationId: LOCATION_ID,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat((subtotal + tax).toFixed(2)),
      paymentMethod: pick(paymentMethods),
      status: pick(statuses),
      cashierId: 'USR0001',
      cashierName: 'Ion Popescu',
      createdAt,
      updatedAt: new Date().toISOString()
    })
  }
  return sales
}

function generateRoles() {
  const roles = [
    {
      name: 'Administrator',
      description: 'Acces complet la toate funcționalitățile sistemului',
      permissions: [
        'appointments:view',
        'appointments:create',
        'appointments:edit',
        'appointments:delete',
        'patients:view',
        'patients:create',
        'patients:edit',
        'patients:delete',
        'users:view',
        'users:create',
        'users:edit',
        'users:delete',
        'roles:view',
        'roles:create',
        'roles:edit',
        'roles:delete',
        'reports:view',
        'reports:create',
        'products:view',
        'products:create',
        'products:edit',
        'products:delete',
        'sales:view',
        'sales:create',
        'sales:edit',
        'treatments:view',
        'treatments:create',
        'treatments:edit',
        'treatments:delete'
      ]
    },
    {
      name: 'Doctor',
      description: 'Acces la programări și pacienți pentru activitatea medicală',
      permissions: [
        'appointments:view',
        'appointments:create',
        'appointments:edit',
        'patients:view',
        'patients:create',
        'patients:edit',
        'treatments:view',
        'treatments:create',
        'treatments:edit'
      ]
    },
    {
      name: 'Asistent',
      description: 'Acces limitat pentru activități de suport medical',
      permissions: [
        'appointments:view',
        'appointments:create',
        'patients:view',
        'patients:edit',
        'treatments:view'
      ]
    },
    {
      name: 'Specialist',
      description: 'Acces extins pentru specialiști medicali',
      permissions: [
        'appointments:view',
        'appointments:create',
        'appointments:edit',
        'patients:view',
        'patients:create',
        'patients:edit',
        'treatments:view',
        'treatments:create',
        'treatments:edit',
        'reports:view'
      ]
    },
    {
      name: 'Rezident',
      description: 'Acces pentru rezidenți în formare',
      permissions: [
        'appointments:view',
        'appointments:create',
        'patients:view',
        'patients:edit',
        'treatments:view'
      ]
    }
  ]
  return roles.map((r, idx) => {
    const id = `ROLE${pad(idx + 1)}`
    return {
      id,
      resourceId: id,
      name: r.name,
      description: r.description,
      permissions: r.permissions,
      status: 'active',
      createdAt: nowIsoMinusDays(randomInt(50, 500)),
      updatedAt: new Date().toISOString()
    }
  })
}

async function seedCounts(appointments, products) {
  // appointmentCounts
  const countsByDate = {}
  for (const a of appointments) {
    countsByDate[a.date] = (countsByDate[a.date] || 0) + 1
  }
  for (const [dateYmd, count] of Object.entries(countsByDate)) {
    await indexedDb.setAppointmentCount(new Date(dateYmd), count)
  }
  // productCounts
  const countsByCategory = {}
  for (const p of products) {
    countsByCategory[p.category] = (countsByCategory[p.category] || 0) + 1
  }
  for (const [category, count] of Object.entries(countsByCategory)) {
    await indexedDb.setProductCount(category, count)
  }
}

export const demoDataSeeder = {
  // Seed for demo button (force seed regardless of VITE_DEMO_MODE)
  async seedForDemo() {
    console.log('[demoSeeder] Force seeding demo data (from demo button)...')
    return this._performSeed(true)
  },

  // Seed only if stores are empty
  async seedIfEmpty() {
    try {
      const isDemo = import.meta.env.VITE_DEMO_MODE === 'true'
      if (!isDemo) {
        console.log('[demoSeeder] Demo mode not enabled, skipping seeding')
        return
      }

      console.log('[demoSeeder] Starting demo data seeding...')
      return this._performSeed(false)
    } catch (e) {
      console.error('[demoSeeder] Demo data seeding failed:', e)
      console.error('[demoSeeder] Error details:', e.message, e.stack)
    }
  },

  // Internal method to perform the actual seeding
  async _performSeed(force = false) {
    try {
      console.log('[demoSeeder] Starting demo data seeding...')
      
      // Wait for database to be ready
      await db.open()

      console.log('[demoSeeder] Checking existing data counts...')
      const [patientsCount, usersCount, treatmentsCount, productsCount, appointmentsCount, salesCount, rolesCount] = await Promise.all([
        indexedDb.count('patient').catch(e => { console.warn('[demoSeeder] Error counting patients:', e); return 0; }),
        indexedDb.count('user').catch(e => { console.warn('[demoSeeder] Error counting users:', e); return 0; }),
        indexedDb.count('treatment').catch(e => { console.warn('[demoSeeder] Error counting treatments:', e); return 0; }),
        indexedDb.count('product').catch(e => { console.warn('[demoSeeder] Error counting products:', e); return 0; }),
        indexedDb.count('appointment').catch(e => { console.warn('[demoSeeder] Error counting appointments:', e); return 0; }),
        indexedDb.count('sale').catch(e => { console.warn('[demoSeeder] Error counting sales:', e); return 0; }),
        indexedDb.count('role').catch(e => { console.warn('[demoSeeder] Error counting roles:', e); return 0; })
      ])
      
      console.log('[demoSeeder] Current counts:', { 
        patients: patientsCount, 
        users: usersCount, 
        treatments: treatmentsCount, 
        products: productsCount, 
        appointments: appointmentsCount, 
        sales: salesCount, 
        roles: rolesCount 
      })

      const needPatients = force || patientsCount === 0
      const needUsers = force || usersCount === 0
      const needTreatments = force || treatmentsCount === 0
      const needProducts = force || productsCount === 0
      const needAppointments = force || appointmentsCount === 0
      const needSales = force || salesCount === 0
      const needRoles = force || rolesCount === 0

      // Always run a normalization pass to backfill missing fields in existing data
      await this.normalizeExistingData()

      if (!force && !(needPatients || needUsers || needTreatments || needProducts || needAppointments || needSales || needRoles)) {
        console.log('[demoSeeder] All stores already have data, skipping seeding')
        return
      }

      // Generate base datasets
      const patients = needPatients ? generatePatients(60) : await indexedDb.getAll('patient')
      const users = needUsers ? generateUsers(12) : await indexedDb.getAll('user')
      const treatments = needTreatments ? generateTreatments() : await indexedDb.getAll('treatment')
      const products = needProducts ? generateProducts() : await indexedDb.getAll('product')

      const appointments = needAppointments ? generateAppointments(patients, users, treatments, 120) : await indexedDb.getAll('appointment')
      const sales = needSales ? generateSales(products, 80) : await indexedDb.getAll('sale')
      const roles = needRoles ? generateRoles() : await indexedDb.getAll('role')

      // Persist data
      console.log('[demoSeeder] Starting data persistence...')
      try {
        if (needPatients) { 
          await indexedDb.bulkPut('patient', patients); 
          console.log('[demoSeeder] patients seeded successfully:', patients.length) 
        }
      } catch (e) { 
        console.error('[demoSeeder] patients seed failed:', e) 
        console.error('[demoSeeder] patients data:', patients.slice(0, 2)) // Log first 2 items for debugging
      }
      
      try {
        if (needUsers) { 
          await indexedDb.bulkPut('user', users); 
          console.log('[demoSeeder] users seeded successfully:', users.length) 
        }
      } catch (e) { 
        console.error('[demoSeeder] users seed failed:', e) 
        console.error('[demoSeeder] users data:', users.slice(0, 2)) // Log first 2 items for debugging
      }
      
      try {
        if (needTreatments) { 
          await indexedDb.bulkPut('treatment', treatments); 
          console.log('[demoSeeder] treatments seeded successfully:', treatments.length) 
        }
      } catch (e) { 
        console.error('[demoSeeder] treatments seed failed:', e) 
        console.error('[demoSeeder] treatments data:', treatments.slice(0, 2)) // Log first 2 items for debugging
      }
      
      try {
        if (needProducts) { 
          await indexedDb.bulkPut('product', products); 
          console.log('[demoSeeder] products seeded successfully:', products.length) 
        }
      } catch (e) { 
        console.error('[demoSeeder] products seed failed:', e) 
        console.error('[demoSeeder] products data:', products.slice(0, 2)) // Log first 2 items for debugging
      }
      
      try {
        if (needAppointments) { 
          await indexedDb.bulkPut('appointment', appointments); 
          console.log('[demoSeeder] appointments seeded successfully:', appointments.length) 
        }
      } catch (e) { 
        console.error('[demoSeeder] appointments seed failed:', e) 
        console.error('[demoSeeder] appointments data:', appointments.slice(0, 2)) // Log first 2 items for debugging
      }
      
      try {
        if (needSales) { 
          await indexedDb.bulkPut('sale', sales); 
          console.log('[demoSeeder] sales seeded successfully:', sales.length) 
        }
      } catch (e) { 
        console.error('[demoSeeder] sales seed failed:', e) 
        console.error('[demoSeeder] sales data:', sales.slice(0, 2)) // Log first 2 items for debugging
      }
      
      try {
        if (needRoles) { 
          await indexedDb.bulkPut('role', roles); 
          console.log('[demoSeeder] roles seeded successfully:', roles.length) 
        }
      } catch (e) { 
        console.error('[demoSeeder] roles seed failed:', e) 
        console.error('[demoSeeder] roles data:', roles.slice(0, 2)) // Log first 2 items for debugging
      }

      // Seed statistics cache for dashboard
      try {
        const today = new Date()
        
        // Appointment statistics breakdown
        const appointmentStats = {
          completed: appointments.filter(a => a.status === 'completed').length,
          scheduled: appointments.filter(a => a.status === 'scheduled').length,
          cancelled: appointments.filter(a => a.status === 'cancelled').length,
          pending: appointments.filter(a => a.status === 'pending').length,
          'in-progress': appointments.filter(a => a.status === 'in-progress').length,
          absent: appointments.filter(a => a.status === 'absent').length
        }
        
        // Revenue calculations
        const monthlyRevenue = sales
          .filter(s => new Date(s.createdAt).getMonth() === today.getMonth())
          .reduce((sum, s) => sum + (s.total || 0), 0)
        
        const totalRevenue = sales.reduce((sum, s) => sum + (s.total || 0), 0)
        
        // Calculate doctor progress (appointments per doctor)
        const doctorStats = {}
        users.forEach(user => {
          const doctorAppointments = appointments.filter(a => 
            a.doctor?.id === user.id || a.doctor?.resourceId === user.resourceId
          )
          const completedToday = doctorAppointments.filter(a => 
            a.status === 'completed' && a.date === formatDateYMD(today)
          ).length
          const scheduledToday = doctorAppointments.filter(a => 
            a.date === formatDateYMD(today)
          ).length
          
          if (scheduledToday > 0) {
            const progress = scheduledToday > 0 ? Math.round((completedToday / scheduledToday) * 100) : 0
            doctorStats[user.medicName] = {
              doctor: user.medicName,
              progress: Math.min(progress, 100),
              appointments: scheduledToday
            }
          }
        })
        
        const doctorProgress = Object.values(doctorStats).slice(0, 4)
        
        // Calculate popular treatments
        const treatmentCounts = {}
        appointments.forEach(a => {
          const treatmentName = a.service?.name || 'Necunoscut'
          treatmentCounts[treatmentName] = (treatmentCounts[treatmentName] || 0) + 1
        })
        
        const popularTreatments = Object.entries(treatmentCounts)
          .map(([treatment, count]) => ({ treatment, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
        
        // Calculate occupancy rate
        const totalSlots = users.length * 8 * 22 // users * 8h/day * 22 days/month
        const bookedSlots = appointments.filter(a => 
          new Date(a.createdAt).getMonth() === today.getMonth()
        ).length
        const occupancyRate = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0
        
        // Generate complete statistics
        const stats = {
          totalPatients: patients.length,
          activePatients: patients.filter(p => p.status === 'active').length,
          totalAppointments: appointments.length,
          appointmentStats,
          appointmentsToday: appointments
            .filter(a => a.date === formatDateYMD(today))
            .slice(0, 5)
            .map(a => ({
              id: a.id,
              patientName: a.patient?.name || 'Pacient',
              time: a.time,
              status: a.status
            })),
          revenue: {
            monthly: monthlyRevenue,
            total: totalRevenue
          },
          websiteBookings: Math.round(appointments.length * 0.3), // 30% from website
          clinicRating: {
            average: 4.7 + Math.random() * 0.3, // Random between 4.7-5.0
            totalReviews: Math.round(patients.length * 0.4) // 40% of patients left reviews
          },
          smsStats: {
            sent: Math.round(appointments.length * 0.8), // 80% of appointments get SMS
            limit: 500,
            percentage: Math.min(Math.round((appointments.length * 0.8 / 500) * 100), 100)
          },
          occupancyRate,
          doctorProgress,
          popularTreatments,
          lowStockProducts: products.filter(p => p.stock <= p.reorderLevel).length
        }
        
        console.log('[demoSeeder] Generated complete statistics:', stats)
        await indexedDb.put('statistics', { id: 'business-statistics', data: stats, timestamp: new Date().toISOString() })
        console.log('[demoSeeder] ✅ Statistics stored in IndexedDB')

        const activities = appointments.slice(0, 15).map(a => ({
          activityType: 'appointment',
          type: 'appointment',
          title: `${a.patient.name} - ${a.service.name}`,
          subtitle: `${a.date} ${a.time} cu ${a.doctor.name}`,
          patientName: a.patient.name,
          serviceName: a.service.name,
          medicName: a.doctor.name,
          time: a.time,
          status: a.status,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt
        }))
        
        console.log('[demoSeeder] Generated recent activities:', activities.length)
        await indexedDb.put('statistics', { id: 'recent-activities', data: activities, timestamp: new Date().toISOString() })
        console.log('[demoSeeder] ✅ Recent activities stored in IndexedDB')
      } catch (e) {
        console.error('[demoSeeder] Error seeding statistics:', e)
      }

      try { 
        await seedCounts(appointments, products); 
        console.log('[demoSeeder] counts seeded successfully') 
      } catch (e) { 
        console.error('[demoSeeder] counts seed failed:', e) 
      }

      // Verify final counts
      console.log('[demoSeeder] Verifying final counts...')
      try {
        const [pc, uc, tc, prc, ac, sc, rc] = await Promise.all([
          indexedDb.count('patient').catch(e => { console.warn('[demoSeeder] Error verifying patients count:', e); return 0; }),
          indexedDb.count('user').catch(e => { console.warn('[demoSeeder] Error verifying users count:', e); return 0; }),
          indexedDb.count('treatment').catch(e => { console.warn('[demoSeeder] Error verifying treatments count:', e); return 0; }),
          indexedDb.count('product').catch(e => { console.warn('[demoSeeder] Error verifying products count:', e); return 0; }),
          indexedDb.count('appointment').catch(e => { console.warn('[demoSeeder] Error verifying appointments count:', e); return 0; }),
          indexedDb.count('sale').catch(e => { console.warn('[demoSeeder] Error verifying sales count:', e); return 0; }),
          indexedDb.count('role').catch(e => { console.warn('[demoSeeder] Error verifying roles count:', e); return 0; })
        ])
        console.log('[demoSeeder] Final verification counts:', { 
          patients: pc, 
          users: uc, 
          treatments: tc, 
          products: prc, 
          appointments: ac, 
          sales: sc, 
          roles: rc 
        })
        
        if (pc > 0 || uc > 0 || tc > 0 || prc > 0 || ac > 0 || sc > 0 || rc > 0) {
          console.log('[demoSeeder] Demo data seeding completed successfully!')
        } else {
          console.warn('[demoSeeder] Warning: No data was seeded to IndexedDB')
        }
      } catch (e) {
        console.error('[demoSeeder] Error during final verification:', e)
      }
    } catch (e) {
      console.error('[demoSeeder] Demo data seeding failed:', e)
      console.error('[demoSeeder] Error details:', e.message, e.stack)
      throw e // Re-throw to be caught by caller
    }
  },

  async normalizeExistingData() {
    try {
      // Patients
      try {
        const patients = await indexedDb.getAll('patient')
        if (patients && patients.length) {
          const normalized = patients.map(p => ({
            ...p,
            resourceId: p.resourceId || p.id,
            id: p.id || p.resourceId,
            name: p.name || p.patientName || 'Pacient',
            status: p.status || 'active'
          }))
          await indexedDb.bulkPut('patient', normalized)
        }
      } catch (_) {}

      // Users (medici)
      try {
        const users = await indexedDb.getAll('user')
        if (users && users.length) {
          const normalized = users.map(u => ({
            ...u,
            resourceId: u.resourceId || u.id,
            id: u.id || u.resourceId,
            medicName: u.medicName || u.fullName || 'Medic',
            status: u.status || 'active'
          }))
          await indexedDb.bulkPut('user', normalized)
        }
      } catch (_) {}

      // Products
      try {
        const products = await indexedDb.getAll('product')
        if (products && products.length) {
          const normalized = products.map(pr => ({
            ...pr,
            resourceId: pr.resourceId || pr.id,
            id: pr.id || pr.resourceId,
            price: typeof pr.price === 'string' ? parseFloat(pr.price) : (pr.price || 0),
            stock: typeof pr.stock === 'string' ? parseInt(pr.stock, 10) : (pr.stock || 0),
            reorderLevel: typeof pr.reorderLevel === 'string' ? parseInt(pr.reorderLevel, 10) : (pr.reorderLevel || 0)
          }))
          await indexedDb.bulkPut('product', normalized)
        }
      } catch (_) {}

      // Treatments
      try {
        const treatments = await indexedDb.getAll('treatment')
        if (treatments && treatments.length) {
          const normalized = treatments.map(t => ({
            ...t,
            resourceId: t.resourceId || t.id,
            id: t.id || t.resourceId,
            treatmentType: t.treatmentType || t.name || 'Tratament',
            price: typeof t.price === 'string' ? parseFloat(t.price) : (t.price || 0),
            duration: typeof t.duration === 'string' ? parseInt(t.duration, 10) : (t.duration || 0)
          }))
          await indexedDb.bulkPut('treatment', normalized)
        }
      } catch (_) {}

      // Appointments
      try {
        const appointments = await indexedDb.getAll('appointment')
        if (appointments && appointments.length) {
          const normalized = appointments.map(a => ({
            ...a,
            resourceId: a.resourceId || a.id,
            id: a.id || a.resourceId,
            patient: typeof a.patient === 'object' ? a.patient : { id: a.patient || null, name: a.patientName || 'Pacient' },
            doctor: typeof a.doctor === 'object' ? a.doctor : { id: a.doctor || null, name: a.doctorName || 'Doctor' },
            service: typeof a.service === 'object' ? a.service : { id: a.service || null, name: a.serviceName || 'Serviciu' },
            status: a.status || 'scheduled'
          }))
          await indexedDb.bulkPut('appointment', normalized)
        }
      } catch (_) {}

      // Sales
      try {
        const sales = await indexedDb.getAll('sale')
        if (sales && sales.length) {
          const normalized = sales.map(s => ({
            ...s,
            resourceId: s.resourceId || s.id,
            id: s.id || s.resourceId,
            total: typeof s.total === 'string' ? parseFloat(s.total) : (s.total || 0),
            subtotal: typeof s.subtotal === 'string' ? parseFloat(s.subtotal) : (s.subtotal || 0),
            tax: typeof s.tax === 'string' ? parseFloat(s.tax) : (s.tax || 0)
          }))
          await indexedDb.bulkPut('sale', normalized)
        }
      } catch (_) {}

      // Roles
      try {
        const roles = await indexedDb.getAll('role')
        if (roles && roles.length) {
          const normalized = roles.map(r => ({
            ...r,
            resourceId: r.resourceId || r.id,
            id: r.id || r.resourceId,
            status: r.status || 'active'
          }))
          await indexedDb.bulkPut('role', normalized)
        }
      } catch (_) {}
    } catch (_) {
      // ignore
    }
  }
}

export default demoDataSeeder


