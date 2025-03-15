from websocket_server import broadcast

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

# Constants
WINDOW = 150
SPAWN_OFFSET = 1280
MOVE_SPEED = 150


def spawn_arrows(game_manager, now, elapsed_time, beatmap_duration, loop_count):
    arrow_map = {arrow["id"]: arrow for arrow in game_manager.objects if arrow["type"].startswith("Arrow") or arrow["type"] == "Button"}
    
    for loop in [loop_count, loop_count + 1]:
        loop_base_time = loop * beatmap_duration
        for beat in BEATMAP:
            beat_time_global = loop_base_time + beat["time"]
            if abs(beat_time_global - elapsed_time) < WINDOW:
                unique_id = f"arrow-{loop}-{beat['time']}"
                if unique_id not in arrow_map:
                    arrow_map[unique_id] = {
                        "id": unique_id,
                        "type": beat["type"],
                        "x": SPAWN_OFFSET,
                        "y": 0,
                        "spawnedAt": now,
                        "time": beat_time_global,
                        "hitBy": [],
                        "missedBy": []
                    }
    return arrow_map


def get_best_arrow_for_player(player, action, timestamp, arrow_map):
    best_arrow = None
    best_dist = float("inf")

    for arrow in arrow_map.values():
        if arrow["type"] != action or player in arrow["hitBy"] or player in arrow["missedBy"]:
            continue

        arrow_elapsed = timestamp - arrow["spawnedAt"]
        arrow_x = SPAWN_OFFSET - MOVE_SPEED * arrow_elapsed
        dist = abs(arrow_x - 80)

        if dist < 50 and dist < best_dist:
            best_arrow = arrow
            best_dist = dist

    return best_arrow, best_dist

async def process_player_input(player_input, game_manager, arrow_map):
    player = player_input["player"]
    action = player_input["action"]
    timestamp = player_input["timestamp"]

    best_arrow, best_dist = get_best_arrow_for_player(player, action, timestamp, arrow_map)

    if best_arrow:
        if player not in best_arrow["hitBy"]:
            best_arrow["hitBy"].append(player)

        feedback, points = ("Perfect", 2) if best_dist <= 20 else ("Good", 1)
    else:
        feedback, points = "Miss", -1

    game_manager.sync_score(player, points)
    await broadcast({
        "type": "score_feedback",
        "player": player,
        "result": feedback,
        "points": points
    })

async def update_arrows_positions(arrow_map, game_manager, now):
    final_arrows = []
    for arrow in arrow_map.values():
        elapsed_time = now - arrow["spawnedAt"]
        arrow["x"] = SPAWN_OFFSET - MOVE_SPEED * elapsed_time

        if arrow["x"] > -50:
            final_arrows.append(arrow)
        else:
            for pid in range(1, game_manager.config["numPlayers"] + 1):
                if pid not in arrow["hitBy"] and pid not in arrow["missedBy"]:
                    arrow["missedBy"].append(pid)
                    game_manager.sync_score(pid, -1)
                    await broadcast({
                        "type": "score_feedback",
                        "player": pid,
                        "result": "Miss",
                        "points": -1
                    })
    return final_arrows

async def update_arrow_game(game_manager, now):
    elapsed_time = (now - game_manager.start_time) * 1000  # Time in ms
    beatmap_duration = BEATMAP[-1]["time"]
    loop_count = int(elapsed_time // beatmap_duration)

    arrow_map = spawn_arrows(game_manager, now, elapsed_time, beatmap_duration, loop_count)

    for player_input in game_manager.player_input_queue:
        await process_player_input(player_input, game_manager, arrow_map)

    game_manager.player_input_queue.clear()

    final_arrows = await update_arrows_positions(arrow_map, game_manager, now)

    return final_arrows
