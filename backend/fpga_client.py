import time
import socket
import random 

# AWS Server Details
AWS_IP = "13.61.26.147"
AWS_PORT = 15234

def send_to_server(client_socket, msg):
    try:
        client_socket.send(msg.encode())
    except Exception as e:
        print(f"Error sending data to server: {e}")

def start_processing(client_socket):
    # Tell FPGA to start processing

    processing = True
    start_time = time.time()
    while processing:

        if (time.time() - start_time >= 5):
            number = random.randint(1, 2)
            encoded_data = str(number).encode("utf-8")
            text = encoded_data.decode("utf-8", errors="ignore").strip()

            #command = f"B {text}"
            #print(command)
            start_time = time.time()
        else:
            number = random.randint(0, 100)
            encoded_data = str(number).encode("utf-8")            
            text = encoded_data.decode("utf-8", errors="ignore").strip()

            #command = f"A {text}"
            #print(command)

        #send_to_server(client_socket, command)

        time.sleep(1)


def main():

    print("FPGA client running, waiting for AWS instructions...")

    while True:
        try:
            # Connect to the AWS server
            client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            client_socket.connect((AWS_IP, AWS_PORT))
            print("Connected to AWS server.")

            # Wait (blocking) for an initial command from AWS
            client_socket.settimeout(None)
            command = client_socket.recv(1024).decode("utf-8").strip()
            if not command:
                print("Disconnected from server.")
                client_socket.close()
                continue

            print(f"Received command from AWS: {command}")
            if command == "S":
                start_processing(client_socket)
            else:
                print("Unknown command received, ignoring.")

            client_socket.close()

        except (ConnectionResetError, ConnectionRefusedError) as e:
            print("Lost connection to AWS, retrying in 5s...", e)
            time.sleep(5)
        except Exception as e:
            print(f"Unexpected error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
