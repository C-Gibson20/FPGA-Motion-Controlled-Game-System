import asyncio
import socket
import json
import time
from config import TCP_PORT
from websocket_server import broadcast

# Global state for FPGA connections
fpga_connections = {}  # Mapping: player_id -> connection (and address)
clients = set()  # WebSocket clients

# Set up the TCP socket for FPGA connection (non-blocking)
tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
tcp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
tcp_socket.bind(('0.0.0.0', TCP_PORT))
tcp_socket.listen(5)
tcp_socket.setblocking(False)

# Handle incoming FPGA (TCP) connections
async def handle_tcp_connection(game_manager):
    loop = asyncio.get_running_loop()
    while True:
        try:
            # Accept FPGA connection asynchronously
            connection_socket, addr = await loop.sock_accept(tcp_socket)
            print(f"FPGA connection from: {addr}")
            connection_socket.setblocking(False)

            # Check if game_config is initialized
            if not game_manager.config:
                print(f"❌ Game configuration is missing. Rejecting connection from {addr}")
                connection_socket.close()
                continue  # Skip to the next iteration (waiting for the next connection)

            # Check if maximum number of players is reached
            if len(fpga_connections) >= game_manager.config["numPlayers"]:
                print(f"❌ Maximum number of FPGA connections reached. Rejecting connection from {addr}")
                connection_socket.close()
                continue  # Skip to the next iteration (waiting for the next connection)

            # Assign player ID and handle communication if game config is set
            player_id = len(fpga_connections) + 1
            fpga_connections[player_id] = {
                "conn": connection_socket,
                "addr": str(addr)
            }
            player_name = game_manager.config["names"][player_id - 1] if player_id - 1 < len(game_manager.config["names"]) else f"Player {player_id}"
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
            # print(f"Received data from player {player_id}: {message}")

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
def handle_init_message(data, game_manager, ws):
    print(f"Received init message: {data}")  # Debugging: Check what data is received
    game_manager.update_config(data.get("numPlayers", 1), data.get("names", []))
    response = {"type": "config_ack"}
    return response

# Function to handle the game start message
def handle_game_start(data, game_manager):
    game_manager.start_time = time.time()
    return {
        "type": "startGame",
        "game_selected": data["gameSelected"],
        "start_at": game_manager.start_time
    }

# Main entry point for the TCP server
async def start_tcp_server(game_manager):
    await handle_tcp_connection(game_manager)

