const NotificationsDrawer = ({ onClose }) => {
  return (
    <div className="p-4">
      <div className="space-y-4">
        <div className="text-sm font-medium text-muted-foreground">
          Notificări recente
        </div>
        
        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Programare nouă</div>
                <div className="text-xs text-muted-foreground">
                  Ion Marinescu - Control de rutină
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Acum 5 minute
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-destructive mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Factură neplătită</div>
                <div className="text-xs text-muted-foreground">
                  #2024-004 - Dumitrescu Mihai
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Acum 1 oră
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-muted-foreground mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Stoc scăzut</div>
                <div className="text-xs text-muted-foreground">
                  Materiale dentare - 5 unități rămase
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Acum 2 ore
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationsDrawer
