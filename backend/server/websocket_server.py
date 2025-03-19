import json
import time
from websockets.server import serve
from db import get_scores
from config import WS_PORT

clients = set()

async def broadcast(data):
    msg = json.dumps(data)
    for ws in list(clients):
        if not ws.closed:
            try:
                await ws.send(msg)
            except Exception as e:
                print(f"Error sending message: {e}")
                clients.discard(ws)


def handle_init_message(data, game_manager, ws):
    print(f"Received init message: {data}")  # Debugging: Check what data is received

    # Using the GameManager's method to update the config
    game_manager.update_config(data.get("numPlayers", 1), data.get("names", []))

    name = data.get("names", ["Player 1"])[0]
    return {"type": "react_player_connected", "name": name}


def handle_game_selection_message(data, game_manager):
    print(f"Received game selection message from player {data.get('player')}: {data}")

    game_manager.mode = data["mode"]
    game_manager.start_time = time.time()
    game_manager.objects.clear()

    return {
        "type": "startGame",
        "mode": game_manager.mode,
        "startAt": game_manager.start_time,
    }


def handle_player_position_message(data, game_manager):
    print(f"Received player position message: {data}")  # Debugging: Check what data is received
    pos = data["position"]
    sent_at = data.get("sentAt")
    game_manager.player_positions[data["player"]] = {
        "x": pos["x"],
        "y": pos["y"],
        "sentAt": sent_at
    }
    return None


def handle_player_input_message(data, game_manager):
    print(f"Received player input message: {data}")  # Debugging: Check what data is received
    game_manager.player_input_queue.append({
        "player": data["player"],
        "action": data["action"],
        "timestamp": data["timestamp"]
    })
    return None


def handle_get_scores_message():
    print("Received get scores message")  # Debugging: Check if message is received
    return {"type": "score_data", "scores": get_scores()}


async def handle_message(data, game_manager, ws):
    msg_type = data.get("type")
    print(f"Received message type: {msg_type}, data: {data}")  # Debugging

    if msg_type == "init":
        return handle_init_message(data, game_manager, ws)
    elif msg_type == "game_selection":
        return handle_game_selection_message(data, game_manager)
    elif msg_type == "player_position":
        return handle_player_position_message(data, game_manager)
    elif msg_type == "player_input":
        return handle_player_input_message(data, game_manager)
    elif msg_type == "get_scores":
        return handle_get_scores_message()
    return None


async def handler(ws, game_manager):
    clients.add(ws)
    try:
        async for message in ws:
            data = json.loads(message)
            response = await handle_message(data, game_manager, ws)

            if response:
                await ws.send(json.dumps(response))

    except Exception as e:
        print(f"Error processing message: {e}")
    finally:
        clients.discard(ws)


def setup_ws(game_manager):
    return lambda ws: handler(ws, game_manager)


async def start_ws_server(game_manager):
    async with serve(setup_ws(game_manager), "0.0.0.0", WS_PORT):
        print(f"[WebSocket] Listening on port {WS_PORT}")
        await game_manager.game_loop()
