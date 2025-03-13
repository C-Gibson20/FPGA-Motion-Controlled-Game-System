import asyncio
import socket
import json
import websockets
import time
import sqlite3
from flask import Flask, jsonify, request

TCP_PORT = 12000  # Port for FPGA communication
WS_PORT = 8765    # Port for WebSocket server
DB_FILE = "game_data.db"  # SQLite database file

# Set up the TCP socket (non-blocking)
tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
tcp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
tcp_socket.bind(('0.0.0.0', TCP_PORT))
tcp_socket.listen(5)
tcp_socket.setblocking(False)

# Flask API Setup
app = Flask(__name__)

def init_db():
    """Initialize the database and create tables if they don't exist."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            score INTEGER DEFAULT 0
        )
    ''')
    conn.commit()
    conn.close()

def update_score(username, increment=1):
    """Update the player's score in the database."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT score FROM players WHERE username = ?', (username,))
    result = cursor.fetchone()
    if result:
        new_score = result[0] + increment
        cursor.execute('UPDATE players SET score = ? WHERE username = ?', (new_score, username))
    else:
        cursor.execute('INSERT INTO players (username, score) VALUES (?, ?)', (username, increment))
    conn.commit()
    conn.close()

def get_scores():
    """Retrieve all player scores from the database."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT username, score FROM players ORDER BY score DESC')
    scores = cursor.fetchall()
    conn.close()
    return scores

@app.route('/scores', methods=['GET'])
def fetch_scores():
    scores = get_scores()
    return jsonify({"scores": scores})

@app.route('/update_score', methods=['POST'])
def api_update_score():
    data = request.json
    username = data.get("username")
    increment = data.get("increment", 1)
    update_score(username, increment)
    return jsonify({"message": "Score updated", "username": username})

# Global state
clients = set()
game_config = None
fpga_connections = {}

# WebSocket handler
async def websocket_handler(websocket):
    global game_config
    clients.add(websocket)
    print(f"✅ WebSocket connected: {websocket.remote_address}")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except Exception as e:
                print("Invalid JSON message:", message)
                continue

            if data.get("type") == "init":
                game_config = {"numPlayers": data.get("numPlayers", 1), "names": data.get("names", [])}
                print("Game configuration received:", game_config)
                await websocket.send(json.dumps({
                    "type": "config_ack",
                    "message": "Configuration received. Waiting for FPGA connections...",
                    "expectedPlayers": game_config["numPlayers"]
                }))
            elif data.get("type") == "get_scores":
                scores = get_scores()
                await websocket.send(json.dumps({"type": "score_data", "scores": scores}))
            else:
                print("Unknown message type from WebSocket:", data)
    except websockets.exceptions.ConnectionClosed:
        print(f"❌ WebSocket disconnected: {websocket.remote_address}")
    finally:
        clients.remove(websocket)

# Handle FPGA (TCP) connections
async def handle_tcp_connection():
    loop = asyncio.get_running_loop()
    while True:
        try:
            connection_socket, addr = await loop.sock_accept(tcp_socket)
            print(f"TCP connection from FPGA: {addr}")
            connection_socket.setblocking(False)
            if game_config and len(fpga_connections) < game_config["numPlayers"]:
                player_id = len(fpga_connections) + 1
                player_name = game_config["names"][player_id - 1] if player_id - 1 < len(game_config["names"]) else f"Player {player_id}"
                fpga_connections[player_id] = {"conn": connection_socket, "addr": str(addr)}
                update_score(player_name, 0)
                await loop.sock_sendall(connection_socket, b"S")
                notification = {"type": "player_connected", "player": player_id, "name": player_name, "address": str(addr)}
                await asyncio.gather(*[client.send(json.dumps(notification)) for client in clients])
                asyncio.create_task(handle_fpga_client(connection_socket, player_id, player_name))
            else:
                connection_socket.close()
                time.sleep(1)
        except Exception as e:
            print("Error accepting FPGA connection:", e)

async def handle_fpga_client(conn, player_id, username):
    loop = asyncio.get_running_loop()
    try:
        while True:
            data = await loop.sock_recv(conn, 1024)
            if not data:
                break
            message = data.decode().strip()
            update_score(username, 1)
            payload = {"type": "data", "player": player_id, "data": message}
            await asyncio.gather(*[client.send(json.dumps(payload)) for client in clients])
    except Exception as e:
        print(f"Error handling FPGA for player {player_id}: {e}")
    finally:
        conn.close()
        disconnect_msg = {"type": "player_disconnected", "player": player_id}
        await asyncio.gather(*[client.send(json.dumps(disconnect_msg)) for client in clients])

async def main():
    init_db()
    ws_server = await websockets.serve(websocket_handler, "0.0.0.0", WS_PORT)
    print("✅ WebSocket server running on port", WS_PORT)
    await asyncio.gather(handle_tcp_connection(), ws_server.wait_closed())

if __name__ == "__main__":
    asyncio.create_task(main())
    app.run(host='0.0.0.0', port=5000)
