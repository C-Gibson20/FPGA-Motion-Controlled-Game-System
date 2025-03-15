import threading
import asyncio
from app import app
from db import init_db
from game_manager import GameManager
from fpga_server import start_tcp_server
from websocket_server import start_ws_server

if __name__ == "__main__":
    init_db()
    threading.Thread(target=lambda: app.run(host="0.0.0.0", port=5000), daemon=True).start()
    game = GameManager()
    asyncio.run(start_ws_server(game), start_tcp_server())
