import time
import asyncio
from config import TICK_RATE
from game_modes.coin_game import update_coin_game
from game_modes.arrow_game import update_arrow_game
from game_modes.spikeball_game import update_spikeball_game
from websocket_server import broadcast

class GameManager:
    def __init__(self):
        self.mode = None
        self.start_time = None
        self.config = None
        self.objects = []
        self.player_positions = {}
        self.player_scores = {}
        self.player_input_queue = []

    def sync_score(self, pid, points=1):
        self.player_scores[pid] = self.player_scores.get(pid, 0) + points
        # Update persistent DB here (optional)

    async def game_loop(self):
        while True:
            await asyncio.sleep(TICK_RATE)
            if not self.mode or not self.start_time:
                continue

            now = time.time()
            if self.mode == "Coin Cascade":
                self.objects[:] = update_coin_game(self, now)
            elif self.mode == "Disco Dash":
                self.objects[:] = await update_arrow_game(self, now)
            elif self.mode == "Bullet Barrage":
                self.objects[:] = update_spikeball_game(self, now)

            await broadcast({
                "type": "gameStateUpdate",
                "mode": self.mode,
                "objects": self.objects,
                "scores": self.player_scores,
                "timestamp": now
            })
