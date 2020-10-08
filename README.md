# mqtt-hue
MQTT integration for Philips HUE

## Docker Compose

```yml
version: '3'

services:

  hue:
    image: 2mqtt/hue:0.0.2

    restart: always

    environment:
      - MQTT_ID=hue
      - MQTT_PATH=hue
      - MQTT_HOST=mqtt://<ip address of mqtt broker>
      - MQTT_USERNAME=<mqtt username>
      - MQTT_PASSWORD=<mqtt password>
      - HUE_HOST=<ip address of hue bridge>
      - HUE_KEY=<hue bridge access key>
      - HUE_INTERVAL=500
```