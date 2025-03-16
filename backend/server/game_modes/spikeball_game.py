import random
import uuid
from utils import distance


def update_spike_position(spike, now):
    elapsed = now - spike["spawnedAt"]
    dx = spike["speed"] * elapsed
    new_x = spike["x"] - dx
    return new_x


def spikeball_collision(spike_pos, new_x, game_manager, pid, scored_hits, scored_dodges):
    player_pos = game_manager.player_positions[pid]
    player_pos_tuple = (player_pos["x"], player_pos["y"])

    if pid not in scored_hits and distance(spike_pos, player_pos_tuple) < 0.2:
        game_manager.sync_score(pid, -1)
        scored_hits.add(pid)

    elif new_x < -2.5 and pid not in scored_hits and pid not in scored_dodges:
        game_manager.sync_score(pid, 1)
        scored_dodges.add(pid)

    return scored_hits, scored_dodges


def update_spikeball_for_player(game_manager, spike, new_x, spike_pos):
    scored_hits = set(spike.get("scoredHits", []))
    scored_dodges = set(spike.get("scoredDodges", []))

    for pid in game_manager.player_positions:
        scored_hits, scored_dodges = spikeball_collision(
            spike_pos, new_x, game_manager, pid, scored_hits, scored_dodges
        )

    return scored_hits, scored_dodges


def update_spikes(game_manager, now):
    updated = []

    for spike in game_manager.objects:
        new_x = update_spike_position(spike, now)
        spike_pos = (new_x, spike["y"])

        scored_hits, scored_dodges = update_spikeball_for_player(game_manager, spike, new_x, spike_pos)

        if new_x > -2.8:
            updated.append({
                **spike,
                "x": new_x,
                "scoredHits": list(scored_hits),
                "scoredDodges": list(scored_dodges)
            })

    return updated


def spawn_new_spike(now):
    return {
        "id": str(uuid.uuid4()),
        "type": "spike",
        "x": 2.5,
        "y": -0.25,
        "speed": 0.005 + random.random() * 0.01,
        "spawnedAt": now,
        "scoredHits": [],
        "scoredDodges": []
    }


def update_spikeball_game(game_manager, now):
    updated = update_spikes(game_manager, now)

    if len(updated) < 1:
        updated.append(spawn_new_spike(now))

    return updated
