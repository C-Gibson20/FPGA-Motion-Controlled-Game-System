# modern_fpga_game_server.py

import asyncio
import json
import random
import socket
import sqlite3
import time
import uuid
from flask import Flask, jsonify, request
from websockets.server import serve, WebSocketServerProtocol

# Configuration
TCP_PORT = 12000
WS_PORT = 8765
DB_FILE = "game_data.db"
TICK_RATE = 1 / 60  # 60 FPS

# Flask app for score viewing / API
app = Flask(__name__)

# Global State
clients = set()
game_mode = None
game_start_time = None
game_objects = []
player_positions = {}   # { player_id: { x, y } }
player_scores = {}      # { player_id: score }
game_config = None
player_input_queue = []  # List of dicts: { player, action, timestamp }

BEATMAP = [
    {"time": 0, "type": "ArrowUp"},
    {"time": 1500, "type": "ArrowLeft"},
    {"time": 3000, "type": "ArrowUp"},
    {"time": 4500, "type": "ArrowRight"},
    {"time": 6000, "type": "Button"},
    {"time": 12000, "type": "ArrowLeft"},
    {"time": 13500, "type": "ArrowUp"},
    {"time": 15000, "type": "ArrowRight"},
    {"time": 16500, "type": "ArrowUp"},
    {"time": 18000, "type": "ArrowLeft"},
    {"time": 19500, "type": "ArrowUp"},
    {"time": 20500, "type": "Button"},
    {"time": 28000, "type": "ArrowUp"},
    {"time": 30500, "type": "ArrowLeft"},
    {"time": 32000, "type": "ArrowRight"}
]

# --------------------------- Database ----------------------------------

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

def sync_score(pid, points=1):
    player_scores[pid] = player_scores.get(pid, 0) + points
    if game_config and "names" in game_config and pid <= len(game_config["names"]):
        username = game_config["names"][pid - 1]
        update_score(username, points)

# --------------------------- Flask Routes ------------------------------

@app.route("/scores")
def scores_api():
    return jsonify({"scores": get_scores()})

@app.route("/update_score", methods=["POST"])
def update_score_api():
    data = request.json
    update_score(data.get("username"), data.get("increment", 1))
    return jsonify({"message": "Score updated"})

# --------------------------- Game Logic -------------------------------

def update_coin_game(objects, now):
    updated = []
    collected_ids = set()

    for coin in objects:
        if now - coin["spawnedAt"] > 5:
            continue

        elapsed = now - coin["spawnedAt"]
        new_y = coin["y"] - 0.5 * coin.get("gravity") * elapsed
        coin_pos = (coin["x"], new_y)

        collected = False
        for pid, pos in player_positions.items():
            if distance(coin_pos, (pos["x"], pos["y"])) < 0.3:
                sync_score(pid)
                collected = True
                break  

        # Remove if collected or off-screen
        if not collected and coin_pos[1] < -0.65:
            continue  

        if not collected:
            updated.append({**coin, "y": new_y})

    # Spawn new coins to maintain count
    while len(updated) < 5:
        updated.append({
            "id": str(uuid.uuid4()),
            "type": "coin",
            "x": random.uniform(-1.5, 1.5),
            "y": 1,
            "gravity": 0.01 + random.random() * 0.01,
            "spawnedAt": now
        })

    return updated

def update_arrow_game(objects, now):
    global player_input_queue

    elapsed = (now - game_start_time) * 1000  
    window = 150
    spawn_offset = 1280
    move_speed = 150
    arrow_map = {arrow["id"]: arrow for arrow in objects if arrow["type"].startswith("Arrow") or arrow["type"] == "Button"}

    beatmap_duration = BEATMAP[-1]["time"]
    loop_count = int(elapsed // beatmap_duration)

    for loop in [loop_count, loop_count + 1]:
        loop_base_time = loop * beatmap_duration
        for beat in BEATMAP:
            beat_time_global = loop_base_time + beat["time"]
            if abs(beat_time_global - elapsed) < window:
                unique_id = f"arrow-{loop}-{beat['time']}"
                if unique_id not in arrow_map:  # Prevent duplicates
                    arrow_map[unique_id] = {
                        "id": unique_id,
                        "type": beat["type"],
                        "x": spawn_offset,
                        "y": 0,
                        "spawnedAt": now,
                        "time": beat_time_global,
                        "hitBy": [],
                        "missedBy": []
                    }

    for input_event in player_input_queue:
        player = input_event["player"]
        action = input_event["action"]
        timestamp = input_event["timestamp"]

        best_arrow = None
        best_dist = float("inf")

        for arrow in arrow_map.values():
            if arrow["type"] != action:
                continue
            if player in arrow["hitBy"] or player in arrow["missedBy"]:
                continue

            arrow_elapsed = timestamp - arrow["spawnedAt"]
            arrow_x = spawn_offset - move_speed * arrow_elapsed
            dist = abs(arrow_x - 80)  # Target hit zone

            if dist < 50 and dist < best_dist:
                best_arrow = arrow
                best_dist = dist

        if best_arrow:
            if player not in best_arrow["hitBy"]:
                best_arrow["hitBy"].append(player)

            if best_dist <= 20:
                feedback = "Perfect"
                points = 2
            else:
                feedback = "Good"
                points = 1
        else:
            feedback = "Miss"
            points = -1

        sync_score(player, points)
        asyncio.create_task(broadcast({
            "type": "score_feedback",
            "player": player,
            "result": feedback,
            "points": points
        }))

    player_input_queue.clear()

    final_arrows = []
    for arrow in arrow_map.values():
        elapsed_time = now - arrow["spawnedAt"]
        arrow["x"] = spawn_offset - move_speed * elapsed_time

        if arrow["x"] > -50:  
            final_arrows.append(arrow)
        else:
            for pid in range(1, game_config["numPlayers"] + 1):
                if pid not in arrow["hitBy"] and pid not in arrow["missedBy"]:
                    arrow["missedBy"].append(pid)
                    sync_score(pid, -1)
                    asyncio.create_task(broadcast({
                        "type": "score_feedback",
                        "player": pid,
                        "result": "Miss",
                        "points": -1
                    }))

    return final_arrows  

def update_spikeball_game(objects, now):
    updated = []

    for spike in objects:
        elapsed = now - spike["spawnedAt"]
        dx = spike["speed"] * elapsed
        new_x = spike["x"] - dx
        spike_pos = (new_x, spike["y"])

        scored_hits = set(spike.get("scoredHits", []))     
        scored_dodges = set(spike.get("scoredDodges", [])) 

        for pid, pos in player_positions.items():
            player_pos = (pos["x"], pos["y"])

            if pid not in scored_hits and distance(spike_pos, player_pos) < 0.2:
                sync_score(pid, -1)  
                scored_hits.add(pid)

            elif new_x < -2.5 and pid not in scored_hits and pid not in scored_dodges:
                sync_score(pid, 1) 
                scored_dodges.add(pid)

        if new_x > -2.8:
            updated.append({
                **spike,
                "x": new_x,
                "scoredHits": list(scored_hits),
                "scoredDodges": list(scored_dodges)
            })

    if len(updated) < 1:
        updated.append({
            "id": str(uuid.uuid4()),
            "type": "spike",
            "x": 2.5,
            "y": -0.25,
            "speed": 0.005 + random.random() * 0.01,
            "spawnedAt": now,
            "scoredHits": [],
            "scoredDodges": []
        })

    return updated

def distance(p1, p2):
    return ((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)**0.5

# --------------------------- Game Loop --------------------------------

async def game_loop():
    global game_objects
    while True:
        await asyncio.sleep(TICK_RATE)
        if not game_mode or not game_start_time:
            continue

        now = time.time()

        if game_mode == "Coin Cascade":
            game_objects[:] = update_coin_game(game_objects, now)
        elif game_mode == "Disco Dash":
            game_objects[:] = update_arrow_game(game_objects, now)
        elif game_mode == "Bullet Barrage":
            game_objects[:] = update_spikeball_game(game_objects, now)

        await broadcast({
            "type": "gameStateUpdate",
            "mode": game_mode,
            "objects": game_objects,
            "scores": player_scores,
            "timestamp": now
        })

# --------------------------- WebSocket Server --------------------------

async def broadcast(data):
    json_msg = json.dumps(data)
    for ws in list(clients):
        try:
            if not ws.closed:
                await ws.send(json_msg)
        except Exception as e:
            print(f"[Broadcast Error] {e}")
            clients.discard(ws)

async def handle_ws(ws: WebSocketServerProtocol):
    global game_mode, game_start_time, game_config
    clients.add(ws)
    print(f"WebSocket connected: {ws.remote_address}")
    try:
        async for message in ws:
            data = json.loads(message)
            msg_type = data.get("type")

            if msg_type == "init":
                game_config = {"numPlayers": data.get("numPlayers", 1), "names": data.get("names", [])}
                await ws.send(json.dumps({"type": "config_ack"}))

            elif msg_type == "game_selection":
                game_mode = data.get("mode")
                game_start_time = time.time()
                game_objects.clear()
                await broadcast({
                    "type": "startGame",
                    "mode": game_mode,
                    "startAt": game_start_time
                })

            elif msg_type == "player_position":
                player = data.get("player")
                pos = data.get("position", {})
                if player:
                    player_positions[player] = pos

            elif msg_type == "player_input":
                player = data.get("player")
                action = data.get("action")
                timestamp = data.get("timestamp")
                player_input_queue.append({
                    "player": player,
                    "action": action,
                    "timestamp": timestamp
                })

            elif msg_type == "get_scores":
                await ws.send(json.dumps({"type": "score_data", "scores": get_scores()}))

    except Exception as e:
        print(f"[WS Error] {e}")
    finally:
        clients.discard(ws)
        print(f"WebSocket disconnected: {ws.remote_address}")

async def start_server():
    init_db()
    async with serve(handle_ws, "0.0.0.0", WS_PORT):
        print(f"WebSocket server running on ws://0.0.0.0:{WS_PORT}")
        await game_loop()

# --------------------------- Start Flask & Async -----------------------

if __name__ == "__main__":
    import threading
    threading.Thread(target=lambda: app.run(host="0.0.0.0", port=5000), daemon=True).start()
    asyncio.run(start_server())
