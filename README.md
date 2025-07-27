# Motion-Controlled Multiplayer Gaming System

<br>

## Overview
This project demonstrates a full-stack, low-latency motion-controlled multiplayer gaming platform integrating embedded FPGA signal processing, real-time cloud networking, and 3D web rendering. The system was designed and coursework for Year 2 **Information Processing** module, part of the **Electronic and Information Engineering** curriculum at **Imperial College London**.

📄 [Technical Report (PDF)](./Information_Processing_Report.pdf) <br>
<br>
The technical report includes demo video showcasing the project outcome.

<br>

## Hardware Layer – Embedded Signal Processing on FPGA

**Platform:** Intel DE10-Lite FPGA
**Languages/Tools:** Verilog, Quartus Prime, Nios II, System Console

* **Sensor Interface**: A 3-axis accelerometer communicates with the FPGA via SPI.
* **FIR Filtering**: A **custom hardware FIR filter** in Verilog smooths raw accelerometer data to mitigate jitter and sensor noise, with real-time tuning visualised via onboard LEDs.
* **Thresholding Logic**: A **Nios II soft-core processor** processes filtered motion signals using a calibrated threshold model, ensuring only meaningful player movements trigger gameplay events.
* **Communication**: Triggered motion events are serialized and transmitted over **UART** to a local client system, ensuring efficient bandwidth use and minimal latency.

### Hardware Latency Optimization

| Filtering Method    | Mean Latency |
| ------------------- | ------------ |
| No Filter           | 19.15 µs     |
| Software Filter     | 3.556 ms     |
| **Hardware Filter** | **31.02 µs** |

<br>

## Client Layer – Local Node Gateway

* **Language/Tech**: Python (lightweight script)
* Receives UART packets from the FPGA.
* Immediately forwards raw motion events to the AWS-hosted backend via a **TCP socket**.
* The design avoids any computational overhead or buffering, enabling a fast, pass-through model.

<bR>

## Server Layer – AWS Modular Backend

**Deployment:** AWS EC2 instance
**Languages/Frameworks:** Python, Flask, WebSocket, Threading

* **WebSocket Server**: Maintains persistent bi-directional connections with all frontend clients for real-time updates.
* **FPGA Event Handler**: Parses, validates, and timestamps incoming motion events.
* **Game Manager**: Coordinates shared game state, manages mini-game delegation, and ensures synchronisation across players.
* **Mini-Game Modules**: Encapsulate core gameplay logic, state machines, animations, and scoring mechanisms.
* **Score Service**: Flask-based microservice using a database to persist global scores and player history.

<bR>

## Frontend Layer – Web-Based 3D Game Renderer

**Frameworks:** React.js, Three.js, WebSocket API

* **Visualisation**: Game elements and player avatars are rendered in real-time using Three.js, enabling dynamic 3D animation and effects.
* **Event Handling**: Motion-triggered events are translated into player actions (e.g., jumps, dashes) based on server instructions.
* **Multiplayer Support**: Each client syncs animations and game progress using the server’s authoritative game state, ensuring consistent visuals across all connected nodes.
* **User Experience Enhancements**: Includes background music, interactive sound effects, and animated transitions triggered by player motion.

<br>

## Latency and Performance Measurement

A custom latency measurement pipeline was implemented across four stages:

1. **Hardware Filtering Latency** – FPGA internal processing
2. **FPGA → Client Transmission** – UART timing
3. **Client → Frontend Reception** – TCP/WebSocket timing
4. **Frontend → Render Execution** – animation trigger delay

| Stage                        | Mean Latency |
| ---------------------------- | ------------ |
| FPGA → Frontend Receive      | \~133 ms     |
| Frontend Receive → Render    | \~10 ms      |
| Frontend → Game Logic Update | \~43 ms      |

* **Clock Synchronisation**: FPGA timestamps are calibrated against browser-based `performance.now()` to account for drift and ensure cross-platform temporal accuracy.

<br>

## System Testing and Validation

* **Phased Testing Approach**:

  * Keyboard-based prototypes for game mechanics
  * UART motion testing with FPGA output triggers
  * Multiplayer testbeds with multiple DE10-Lite boards
  * End-to-end latency logging and debugging using `requestAnimationFrame()`
* **Hardware Debugging**:

  * Hex LED indicators for player identity
  * Buttons for triggering test animations
  * Real-time LED feedback for FIR filter tuning

<br>

## Functional Features and Extensions

| Feature                         | Implementation Summary               |
| ------------------------------- | ------------------------------------ |
| FPGA Motion Event Processing    | FIR Filter + Thresholding + UART     |
| Real-Time Multiplayer Sync      | WebSockets + Server-Centric Logic    |
| Modular Mini-Game Architecture  | Dedicated server-side state machines |
| Web-Based Visualisation         | React + Three.js dynamic rendering   |
| Sound and Animation Integration | Triggered SFX + Background Music     |
| Global Score Persistence        | Flask Service + Cloud DB             |
| Clock Calibration Mechanism     | FPGA timestamp ↔ Browser alignment   |
