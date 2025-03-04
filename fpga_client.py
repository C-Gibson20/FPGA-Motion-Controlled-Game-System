#!/usr/bin/env python3
import sys
import time
import socket
import intel_jtag_uart

# AWS Server Details
AWS_IP = "13.61.26.147"
AWS_PORT = 12000

def send_command(command, ju):
    try:
        cmd = command + "\n"
        ju.write(cmd.encode("utf-8"))
        print(f"Sent command to FPGA: {command}")
    except Exception as e:
        print(f"Error sending command to FPGA: {e}")

def send_to_server(client_socket, msg):
    try:
        client_socket.send(msg.encode())
    except Exception as e:
        print(f"Error sending data to server: {e}")

def start_processing(ju, client_socket):
    # Tell FPGA to start processing
    send_command("S", ju)

    processing = True
    while processing:
        try:
            # Read data from FPGA (this should return measurements when processing)
            data = ju.read()
            if data:
                text = data.decode("utf-8", errors="ignore").strip()
                if text:
                    print(f"FPGA {text}")
                    send_to_server(client_socket, text)

        except Exception as e:
            print("Error during processing:", e)
            break

def main():

    try:
        ju = intel_jtag_uart.intel_jtag_uart()
    except Exception as e:
        print("Error opening JTAG UART:", e)
        sys.exit(1)

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
                start_processing(ju, client_socket)
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
