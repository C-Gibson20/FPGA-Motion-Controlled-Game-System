

#include "system.h"
#include "altera_up_avalon_accelerometer_spi.h"
#include "altera_avalon_timer_regs.h"
#include "altera_avalon_timer.h"
#include "altera_avalon_pio_regs.h"
#include "sys/alt_stdio.h"
#include "sys/alt_irq.h"
#include "alt_types.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>
#include <unistd.h>

int getc(FILE *fp) {
    return alt_getchar();
}


/*==================================================
  FIR Filter, Accelerometer, LED & Timer (PWM) Code
==================================================*/
#define PWM_PERIOD 16
// Define 7-segment representations
#define SEG_P 0x0C  // P 000 0100    0b000 1 100
#define SEG_0 0xFF  // 0
#define SEG_1 0xF9  // 2 111 0110
#define SEG_2 0x24  // 1 010 0100


// Global pointer for the accelerometer SPI device.
alt_up_accelerometer_spi_dev *acc_dev;

// Global flag for processing and buttons
volatile int processing = 1;
volatile alt_u8 button_flags = 0;

void displayPlayer(int player) {
    // Set "PLAYER" on HEX5-HEX1
    IOWR_ALTERA_AVALON_PIO_DATA(HEX3_BASE, SEG_P);
    IOWR_ALTERA_AVALON_PIO_DATA(HEX0_BASE, SEG_0);
    IOWR_ALTERA_AVALON_PIO_DATA(HEX5_BASE, SEG_0);
    IOWR_ALTERA_AVALON_PIO_DATA(HEX4_BASE, SEG_0);
    IOWR_ALTERA_AVALON_PIO_DATA(HEX1_BASE, SEG_0);
    IOWR_ALTERA_AVALON_PIO_DATA(HEX2_BASE, (player == 1) ? SEG_1 : SEG_2);  // Show 1 or 2
}

/*-----------------------------
		 Button ISR
 ----------------------------*/
static void button_isr(void *context, alt_u32 id)
{
    // Read edge capture register
    alt_u32 edge_capture = IORD_ALTERA_AVALON_PIO_EDGE_CAP(BUTTON_BASE);

    // Ignore spurious interrupts
    if (edge_capture == 0) return;

    printf("B %x\n", edge_capture);

    // Register button event
    button_flags |= edge_capture;

    // Clear the detected interrupt
    IOWR_ALTERA_AVALON_PIO_EDGE_CAP(BUTTON_BASE, edge_capture);
}


/*-----------------------------
         Main Function
-----------------------------*/
int main() {
    alt_32 x_read;  // Variable to store the accelerometer reading

    printf("FIR Filtering Enabled - Starting accelerometer processing...\n");

    // Open the accelerometer SPI device
    acc_dev = alt_up_accelerometer_spi_open_dev("/dev/accelerometer_spi");
    if (acc_dev == NULL) {
        printf("Error: Accelerometer SPI device not found.\n");
        return 1;
    }

    printf("Initializing FPGA...\n");
    displayPlayer(2);


    IOWR_ALTERA_AVALON_PIO_IRQ_MASK(BUTTON_BASE, 0x03);  // Enable IRQ for both buttons
    IOWR_ALTERA_AVALON_PIO_EDGE_CAP(BUTTON_BASE, 0x00);  // Clear any previous interrupts

    if (alt_irq_register(BUTTON_IRQ, NULL, button_isr) == 0) {
        printf("Button ISR registered successfully.\n");
    } else {
        printf("Failed to register Button ISR!\n");
    }

    printf("Button IRQ Registered: %d\n", BUTTON_IRQ);

    while (1) {
        if (processing) {
            alt_up_accelerometer_spi_read_x_axis(acc_dev, &x_read);
            printf("A %d\n", (int)x_read);
        }

        alt_u8 button_state = button_flags;
        if (button_state) {
            button_state = 0;
        }

        usleep(50000);
    }

    return 0;
}



