import asyncio
import socket
import json
import websockets
import time
import sqlite3
from flask import Flask, jsonify, request
import random
import uuid

# Configurations
TCP_PORT = 12000
WS_PORT = 8765
DB_FILE = "game_data.db"

# Flask API Setup
app = Flask(__name__)

# Global state
clients = set()
fpga_connections = {}
game_config = None

#=================================================
# Database functions
#=================================================

def init_db():
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
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('SELECT username, score FROM players ORDER BY score DESC')
    scores = cursor.fetchall()
    conn.close()
    return scores

#=================================================
# Flask routes
#=================================================

@app.route('/scores', methods=['GET'])
def fetch_scores():
    return jsonify({"scores": get_scores()})

@app.route('/update_score', methods=['POST'])
def api_update_score():
    data = request.json
    update_score(data.get("username"), data.get("increment", 1))
    return jsonify({"message": "Score updated"})

#=================================================
# WebSocket handling
#=================================================

async def handle_ws(websocket):
    global mode, game_start_time
    clients.add(websocket)
    print(f"WebSocket connected: {websocket.remote_address}")

    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except json.JSONDecodeError:
                print("Invalid JSON message:", message)
                continue

            message_type = data.get("type")

            if message_type == "init":
                await handle_init_message(data)
            elif message_type == "game_selection":
                mode = data.get("mode")
                game_start_time = time.time()
                await broadcast({
                    "type": "startGame",
                    "mode": mode,
                    "startAt": game_start_time  # Delay start time for sync
                })
            elif message_type == "player_position":
                player = data.get("player")
                pos = data.get("position", {})
                if player:
                    player_positions[player] = pos

            elif message_type == "get_scores":
                await websocket.send(json.dumps({"type": "score_data", "scores": get_scores()}))
            else:
                print("Unknown message type:", data)

    except websockets.exceptions.ConnectionClosed:
        print(f"WebSocket disconnected: {websocket.remote_address}")
    finally:
        clients.remove(websocket) 

async def handle_init_message(ws, data):
    global game_config
    game_config = {"numPlayers": data.get("numPlayers", 1), "names": data.get("names", [])}
    print("Game configuration received:", game_config)

    await ws.send(json.dumps({
        "type": "config_ack",
        "message": "Configuration received. Waiting for FPGA connections...",
        "expectedPlayers": game_config["numPlayers"]
    }))

#=================================================
# TCP handling
#=================================================
async def accept_tcp_connection(server_socket):
    loop = asyncio.get_running_loop()
    while True:
        try:
            conn, addr = await loop.sock_accept(server_socket)
            print(f"TCP connection from FPGA: {addr}")
            conn.setblocking(False)
            await register_fpga_connection(conn, addr)
        except Exception as e:
            print("Error accepting TCP connection:", e)

async def register_fpga_connection(conn, addr):
    global game_config

    if not game_config or len(fpga_connections) >= game_config["numPlayers"]:
        conn.close()
        return
    
    player_id = len(fpga_connections) + 1
    player_name = game_config["names"][player_id - 1] if player_id - 1 < len(game_config["names"]) else f"Player {player_id}"
    fpga_connections[player_id] = {"conn": conn, "addr": str(addr)}

    update_score(player_name, 0)
    await asyncio.get_running_loop().sock_sendall(conn, b"S")

    await broadcast({
        "type": "player_connected",
        "player": player_id,
        "name": player_name,
        "address": str(addr)
    })

    asyncio.create_task(handle_fpga_client(conn, player_id, player_name))

async def handle_fpga_client(conn, player_id, username):
    loop = asyncio.get_running_loop()
    try:
        while True:
            data = await loop.sock_recv(conn, 1024)
            if not data:
                break
            message = data.decode().strip()
            update_score(username, 1)
            
            await broadcast({
                "type": "data",
                "player": player_id,
                "data": message
            })
    except Exception as e:
        print(f"Error handling FPGA for player {player_id}: {e}")
    finally:
        conn.close()
        await broadcast({
            "type": "player_disconnected",
            "player": player_id
        })

#=================================================
# Game objects
#=================================================

clients = set()
mode = None
game_start_time = None
game_objects = []
TICK_RATE = 1 / 30
player_positions = {}  # { player_id: { x: float, y: float } }
player_scores = {}     # { player_id: int }


BEATMAP = [
    {"time": 0, "type": " "},
    {"time": 1500, "type": "ArrowLeft"},
    {"time": 3000, "type": "ArrowUp"},
    {"time": 4500, "type": "ArrowRight"},
    {"time": 6000, "type": " "},
    {"time": 12000, "type": "ArrowLeft"},
    {"time": 13500, "type": "ArrowUp"},
    {"time": 15000, "type": "ArrowRight"},
    {"time": 16500, "type": "ArrowUp"},
    {"time": 18000, "type": "ArrowLeft"},
    {"time": 19500, "type": "ArrowUp"},
    {"time": 20000, "type": " "},
    {"time": 28000, "type": "ArrowUp"},
    {"time": 30500, "type": "ArrowLeft"},
    {"time": 32000, "type": "ArrowRight"}
]

def update_coin_game(objects, now):
    updated = []
    collected_ids = set()

    for coin in objects:
        if now - coin["spawnedAt"] > 5:
            continue  # coin expired

        # Simulate falling
        dy = (now - coin["spawnedAt"]) * 2
        new_y = coin["y"] - dy

        coin_pos = (coin["x"], new_y)

        # Collision check with all players
        for pid, ppos in player_positions.items():
            if distance(coin_pos, (ppos["x"], ppos["y"])) < 0.3:
                player_scores[pid] = player_scores.get(pid, 0) + 1
                collected_ids.add(coin["id"])
                break

        if coin["id"] not in collected_ids:
            updated.append({**coin, "y": new_y})

    # Spawn new coins
    if len(updated) < 5:
        new_coin = {
            "id": str(uuid4()),
            "type": "coin",
            "x": random.uniform(-4, 4),
            "y": 3,
            "spawnedAt": now
        }
        updated.append(new_coin)

    return updated

def distance(p1, p2):
    return ((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2) ** 0.5


def update_arrow_game(now):
    # This doesn't need to keep old arrows, just spawn new ones based on beatmap
    arrows = []
    elapsed = (now - game_start_time) * 1000  # in ms
    window = 150  # time window to spawn an arrow

    for beat in BEATMAP:
        if abs(beat["time"] - elapsed) < window:
            arrows.append({
                "id": f"arrow-{beat['time']}",
                "type": beat["type"],
                "x": 1280,
                "y": 0,
                "spawnedAt": now
            })

    return arrows

def update_spikeball_game(objects, now):
    updated = []
    # Simulate movement (leftward) at 4 units/sec
    for spike in objects:
        dx = (now - spike["spawnedAt"]) * 4
        new_x = spike["x"] - dx
        if new_x > -6:
            updated.append({**spike, "x": new_x})

    if len(updated) < 3:
        updated.append({
            "id": str(uuid.uuid4()),
            "type": "spike",
            "x": 5,
            "y": -1.5,  # floor level
            "spawnedAt": now
        })

    return updated

async def game_loop():
    global game_objects, game_start_time

    while True:
        await asyncio.sleep(TICK_RATE)

        if not mode or not game_start_time:
            continue  # Wait for a game to start

        now = time.time()

        if mode == "Coin Cascade":
            game_objects = update_coin_game(game_objects, now)

        elif mode == "Disco Dash":
            game_objects = update_arrow_game(now)

        elif mode == "Bullet Barrage":
            game_objects = update_spikeball_game(game_objects, now)

        await broadcast({
            "type": "gameStateUpdate",
            "mode": mode,
            "objects": game_objects,
            "scores": player_scores,
            "timestamp": now
        })

#=================================================
# Broadcast function
#=================================================

async def broadcast(data):
    if clients:
        json_msg = json.dumps(data)
        await asyncio.gather(*[client.send(json_msg) for client in clients if not client.closed])

#=================================================
# Main function
#=================================================

async def start_async_services():
    init_db()
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(('0.0.0.0', TCP_PORT))
    server_socket.listen(5)
    server_socket.setblocking(False)

    ws_server = await websockets.serve(handle_ws, "0.0.0.0", WS_PORT)
    print("WebSocket server running on port", WS_PORT)

    # Start the game loop here
    # asyncio.create_task(game_loop())

    await asyncio.gather(accept_tcp_connection(server_socket), ws_server.wait_closed(), game_loop())

if __name__ == "__main__":
    asyncio.create_task(start_async_services())
    app.run(host='0.0.0.0', port=5000)
