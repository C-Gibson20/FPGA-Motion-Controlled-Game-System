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
    print(f"Received game selection message: {data}")
    
    player = data.get("player")  # identify the player (should be sent from client)
    mode = data.get("mode")
    
    if not player:
        print("Missing player ID in game selection")
        return {"type": "error", "message": "Missing player ID"}

    # Store the vote
    game_manager.selection_votes[player] = mode

    # Check if all expected players voted
    if len(game_manager.selection_votes) >= game_manager.config["num_players"]:
        selected_modes = list(game_manager.selection_votes.values())
        if all(game == selected_modes[0] for game in selected_modes):
            # All selected the same game
            game_manager.mode = selected_modes[0]
            game_manager.start_time = time.time()
            game_manager.objects.clear()

            start_message = {
                "type": "startGame",
                "mode": game_manager.mode,
                "startAt": game_manager.start_time,
            }

            # Clear votes after use
            game_manager.selection_votes.clear()

            # Broadcast to all clients
            return start_message
        else:
            # Mismatched game selections
            print("Players selected different games")
            game_manager.selection_votes.clear()
            return {
                "type": "game_selection_error",
                "message": "All players must select the same game."
            }

    return None  # Wait for more players to vote



def handle_player_position_message(data, game_manager):
    print(f"Received player position message: {data}")  # Debugging: Check what data is received
    game_manager.player_positions[data["player"]] = data["position"]
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
