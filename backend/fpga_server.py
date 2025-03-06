import asyncio
import socket
import json
import websockets

TCP_PORT = 12000  # Port for FPGA communication
WS_PORT = 8765    # Port for WebSocket server

# Set up the TCP socket (non-blocking)
tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
tcp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
tcp_socket.bind(('0.0.0.0', TCP_PORT))
tcp_socket.listen(5)
tcp_socket.setblocking(False)

# Global state
clients = set()        # Connected WebSocket clients
game_config = None     # Received from website: { numPlayers, names }
fpga_connections = {}  # Mapping: player number -> connection (and we'll include the address)

# WebSocket handler – waits for an initialization message from the website.
async def websocket_handler(websocket):
    global game_config
    clients.add(websocket)
    print(f"✅ WebSocket connected: {websocket.remote_address}")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
            except Exception as e:
                print("Invalid JSON message:", message)
                continue

            if data.get("type") == "init":
                # Save configuration from the website.
                game_config = {
                    "numPlayers": data.get("numPlayers", 1),
                    "names": data.get("names", [])
                }
                print("Game configuration received:", game_config)
                await websocket.send(json.dumps({
                    "type": "config_ack",
                    "message": "Configuration received. Waiting for FPGA connections...",
                    "expectedPlayers": game_config["numPlayers"]
                }))
            else:
                print("Unknown message type from WebSocket:", data)
    except websockets.exceptions.ConnectionClosed:
        print(f"❌ WebSocket disconnected: {websocket.remote_address}")
    finally:
        clients.remove(websocket)

# Asynchronously accept FPGA (TCP) connections and assign them a player ID.
async def handle_tcp_connection():
    loop = asyncio.get_running_loop()
    while True:
        try:
            connection_socket, addr = await loop.sock_accept(tcp_socket)
            print(f"TCP connection from FPGA: {addr}")
            connection_socket.setblocking(False)
            if game_config and len(fpga_connections) < game_config["numPlayers"]:
                player_id = len(fpga_connections) + 1
                fpga_connections[player_id] = {
                    "conn": connection_socket,
                    "addr": str(addr)
                }
                player_name = (game_config["names"][player_id - 1]
                               if player_id - 1 < len(game_config["names"])
                               else f"Player {player_id}")
                print(f"Assigned FPGA {addr} to player {player_id} ({player_name})")
                # (Optional) Send an initial command to the FPGA.
                await loop.sock_sendall(connection_socket, b"S")
                # Notify WebSocket clients about this FPGA assignment.
                notification = {
                    "type": "player_connected",
                    "player": player_id,
                    "name": player_name,
                    "address": str(addr)
                }
                await asyncio.gather(*[client.send(json.dumps(notification)) for client in clients])
                
                # If we have reached the expected number of connections, notify the website.
                if len(fpga_connections) == game_config["numPlayers"]:
                    all_connected_msg = {
                        "type": "all_connected",
                        "message": "All FPGA connections established.",
                        "players": [
                            {
                                "player": pid,
                                "name": game_config["names"][pid - 1] if pid - 1 < len(game_config["names"]) else f"Player {pid}",
                                "address": fpga_connections[pid]["addr"]
                            }
                            for pid in fpga_connections
                        ]
                    }
                    await asyncio.gather(*[client.send(json.dumps(all_connected_msg)) for client in clients])
                
                # Start a task to process messages from this FPGA.
                asyncio.create_task(handle_fpga_client(connection_socket, player_id))
            else:
                print("Either no game configuration or maximum FPGA connections reached. Closing connection from", addr)
                connection_socket.close()
        except Exception as e:
            print("Error accepting FPGA connection:", e)

# Receive data from an FPGA client and forward it to WebSocket clients with the player ID.
async def handle_fpga_client(conn, player_id):
    loop = asyncio.get_running_loop()
    try:
        while True:
            data = await loop.sock_recv(conn, 1024)
            if not data:
                print(f"FPGA connection for player {player_id} closed.")
                break
            message = data.decode().strip()
            print(f"Data from player {player_id}: {message}")
            payload = {
                "type": "data",
                "player": player_id,
                "data": message,
                "button" : message[0] == 'B'
            }
            await asyncio.gather(*[client.send(json.dumps(payload)) for client in clients])
    except Exception as e:
        print(f"Error handling FPGA for player {player_id}: {e}")
    finally:
        conn.close()
        disconnect_msg = {"type": "player_disconnected", "player": player_id}
        await asyncio.gather(*[client.send(json.dumps(disconnect_msg)) for client in clients])

async def main():
    ws_server = await websockets.serve(websocket_handler, "0.0.0.0", WS_PORT)
    print("✅ WebSocket server running on port", WS_PORT)
    await asyncio.gather(handle_tcp_connection(), ws_server.wait_closed())

if __name__ == "__main__":
    asyncio.run(main())
