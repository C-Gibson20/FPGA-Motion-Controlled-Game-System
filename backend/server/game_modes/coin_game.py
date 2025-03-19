import random
import uuid
import time
from utils import distance


def update_coin_positions(game_manager, now):
    updated = []
    
    for coin in game_manager.objects:
        if now - coin["spawnedAt"] > 5:
            continue

        elapsed = now - coin["spawnedAt"]
        new_y = coin["y"] - 0.5 * coin.get("gravity") * elapsed
        coin_pos = (coin["x"], new_y)

        if not coin_collection(coin_pos, game_manager):
            if coin_pos[1] < -0.65:
                continue
            updated.append({**coin, "y": new_y})

    return updated


def coin_collection(coin_pos, game_manager):
    for pid, pos in game_manager.player_positions.items():
        if distance(coin_pos, (pos["x"], pos["y"])) < 0.3:
            game_manager.sync_score(pid)

            if pos.get("sentAt"):
                server_time = time.time() * 1000  # ms
                latency = server_time - pos["sentAt"]
                print(f"[Latency #2] Player {pid} | Coin collected | Latency: {latency:.2f} ms")

            return True
    return False


def spawn_new_coins(updated, now):
    while len(updated) < 3:
        updated.append(create_new_coin(now))

    return updated


def create_new_coin(now):
    return {
        "id": str(uuid.uuid4()),
        "type": "coin",
        "x": random.uniform(-1.5, 1.5),
        "y": 1,
        "gravity": 0.005 + random.random() * 0.02,
        "spawnedAt": now
    }


def update_coin_game(game_manager, now):
    updated = update_coin_positions(game_manager, now)
    updated = spawn_new_coins(updated, now)

    return updated
