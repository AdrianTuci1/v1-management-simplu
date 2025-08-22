import { Users, Plus, Search, Filter } from 'lucide-react'

const OperationsPeople = ({ onDrawerOpen }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Persoane</h1>
          <p className="text-muted-foreground">
            Gestionează clienții și personalul
          </p>
        </div>
        <button
          onClick={() => onDrawerOpen({ type: 'new-person' })}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Persoană nouă
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Caută persoane..."
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <button className="btn btn-outline">
              <Filter className="h-4 w-4 mr-2" />
              Filtrează
            </button>
          </div>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h3 className="card-title">Lista Persoane</h3>
          </div>
        </div>
        <div className="card-content">
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Secțiunea Persoane</h3>
            <p className="text-muted-foreground mb-4">
              Aici vei putea gestiona clienții și personalul companiei.
            </p>
            <button className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Adaugă prima persoană
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OperationsPeople
