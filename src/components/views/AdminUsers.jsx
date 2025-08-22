import { User, Plus } from 'lucide-react'

const AdminUsers = ({ onDrawerOpen }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Utilizatori</h1>
          <p className="text-muted-foreground">Gestionează utilizatorii sistemului</p>
        </div>
        <button onClick={() => onDrawerOpen({ type: 'new-user' })} className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Utilizator nou
        </button>
      </div>
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Secțiunea Utilizatori</h3>
            <p className="text-muted-foreground">Aici vei putea gestiona utilizatorii sistemului.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers
