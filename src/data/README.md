[UI Component]
       |
       v
 [Command] ----> [Invoker]
       |               |
       v               v
 [ResourceRepository]  |
   |   |   |           |
   |   |   +--> API -----> [Server /api/resources]
   |   |                 ^
   |   +--> IndexedDB ----|
   |                      |
   +--> WebSocket <-------+