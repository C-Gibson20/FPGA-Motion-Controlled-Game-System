import asyncio
import socket
import json
import time
from config import TCP_PORT
from websocket_server import broadcast

# Global state for FPGA connections
fpga_connections = {}  # Mapping: player_id -> connection (and address)
game_config = None  # Game configuration (number of players, player names)
clients = set()  # WebSocket clients

# Set up the TCP socket for FPGA connection (non-blocking)
tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
tcp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
tcp_socket.bind(('0.0.0.0', TCP_PORT))
tcp_socket.listen(5)
tcp_socket.setblocking(False)

# Handle incoming FPGA (TCP) connections
async def handle_tcp_connection():
    loop = asyncio.get_running_loop()
    while True:
        try:
            # Accept FPGA connection asynchronously
            connection_socket, addr = await loop.sock_accept(tcp_socket)
            print(f"FPGA connection from: {addr}")
            connection_socket.setblocking(False)

            # Debugging output to verify number of players and connections
            print(f"Game configuration: {game_config}")
            print(f"Current FPGA connections: {len(fpga_connections)} / {game_config['numPlayers']}")

            # Assign player ID and handle communication if game config is set
            if game_config and len(fpga_connections) < game_config["numPlayers"]:
                player_id = len(fpga_connections) + 1
                fpga_connections[player_id] = {
                    "conn": connection_socket,
                    "addr": str(addr)
                }
                player_name = game_config["names"][player_id - 1] if player_id - 1 < len(game_config["names"]) else f"Player {player_id}"
                print(f"Assigned FPGA at {addr} to Player {player_id} ({player_name})")

                # Notify WebSocket clients about this FPGA connection
                notification = {
                    "type": "player_connected",
                    "player": player_id,
                    "name": player_name,
                    "address": str(addr)
                }
                await broadcast(notification)

                # Send initial command to FPGA
                await loop.sock_sendall(connection_socket, b"S")

                # Start handling FPGA client messages asynchronously
                asyncio.create_task(handle_fpga_client(connection_socket, player_id))
            else:
                print("Game not configured or maximum connections reached. Closing connection.")
                connection_socket.close()
                time.sleep(1)

        except Exception as e:
            print(f"Error accepting FPGA connection: {e}")


# Handle FPGA communication (data exchange)
async def handle_fpga_client(conn, player_id):
    loop = asyncio.get_running_loop()
    try:
        while True:
            data = await loop.sock_recv(conn, 1024)
            if not data:
                print(f"FPGA connection for player {player_id} closed.")
                break
            message = data.decode().strip()
            print(f"Received data from player {player_id}: {message}")

            # Process received message from FPGA
            payload = {
                "type": "data",
                "player": player_id,
                "data": message,
                "button1": message == 'B1',
                "button2": message == 'B2',
                "jump": message == 'J',
                "left": message == 'L',
                "right": message == 'R',
                "still": message == 'N'
            }

            # Broadcast this data to all WebSocket clients
            await broadcast(payload)

    except Exception as e:
        print(f"Error handling FPGA for player {player_id}: {e}")
    finally:
        conn.close()
        disconnect_msg = {"type": "player_disconnected", "player": player_id}
        await broadcast(disconnect_msg)

# Function to handle the game initialization message from WebSocket
def handle_init_message(data):
    global game_config
    game_config = {
        "numPlayers": data.get("numPlayers", 1),
        "names": data.get("names", [])
    }
    print(f"Game configuration received: {game_config}")
    return {"type": "config_ack"}

# Function to handle the game start message
def handle_game_start(data, game_manager):
    game_manager.config = game_config
    game_manager.start_time = time.time()
    return {
        "type": "startGame",
        "game_selected": data["gameSelected"],
        "start_at": game_manager.start_time
    }

# Main entry point for the TCP server
async def start_tcp_server():
    await handle_tcp_connection()
