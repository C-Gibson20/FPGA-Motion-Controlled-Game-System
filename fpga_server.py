import socket
import time
import select

print("We're in the TCP server...")

# Select a server port
server_port = 12000

# Create a welcoming socket
welcome_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
welcome_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

# Bind the server to all interfaces on the selected port
welcome_socket.bind(('0.0.0.0', server_port))
welcome_socket.listen(5)  # Allow multiple connections

print(f"Server running on port {server_port}")

while True:
    try:
        connection_socket, caddr = welcome_socket.accept()
        print(f"Connection established with {caddr}")

        # Record the time when we last sent 'S'
        print("Sending S to FPGA...")
        connection_socket.send("S".encode())

        while True:
            # Use select to wait for data with a timeout of 1 second.
            # This way we can periodically check if 10 seconds have passed.
            ready, _, _ = select.select([connection_socket], [], [], 1)
            if ready:
                cmsg = connection_socket.recv(1024)
                if not cmsg:
                    print(f"Client {caddr} disconnected.")
                    break

                # Decode and print the message received from the client
                cmsg = cmsg.decode().strip()
                print(f"Received from FPGA: {cmsg}")


    except ConnectionResetError:
        print(f"Connection reset by client {caddr}. Closing connection.")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        connection_socket.close()
