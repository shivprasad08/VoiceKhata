from fastapi import WebSocket
from typing import Dict, List
import uuid

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID):
        await websocket.accept()
        uid = str(user_id)
        if uid not in self.active_connections:
            self.active_connections[uid] = []
        self.active_connections[uid].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: uuid.UUID):
        uid = str(user_id)
        if uid in self.active_connections:
            if websocket in self.active_connections[uid]:
                self.active_connections[uid].remove(websocket)
            if not self.active_connections[uid]:
                del self.active_connections[uid]

    async def broadcast(self, user_id: uuid.UUID, message: dict):
        uid = str(user_id)
        if uid in self.active_connections:
            for connection in self.active_connections[uid]:
                try:
                    await connection.send_json(message)
                except:
                    pass

manager = ConnectionManager()
