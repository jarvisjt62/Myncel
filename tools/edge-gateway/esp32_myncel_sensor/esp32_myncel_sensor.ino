/*
  Myncel ESP32 Telemetry Sensor

  Sends readings directly to Myncel's secure device-token endpoint:
    POST https://YOUR-MYNCEL-DOMAIN.com/api/iot/ingest

  Arduino Library Manager dependencies:
    - ArduinoJson
    - DHT sensor library by Adafruit, if using DHT22/DHT11
    - Adafruit Unified Sensor, if using DHT

  Configure WiFi, MYNCEL_BASE_URL, and MYNCEL_DEVICE_TOKEN before flashing.
*/

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Optional DHT support. Comment these three lines if not using DHT.
#include <DHT.h>
#define DHT_PIN 4
#define DHT_TYPE DHT22
DHT dht(DHT_PIN, DHT_TYPE);

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* MYNCEL_BASE_URL = "https://YOUR-MYNCEL-DOMAIN.com";
const char* MYNCEL_DEVICE_TOKEN = "myncel_dt_REPLACE_WITH_DEVICE_TOKEN";

const unsigned long SEND_INTERVAL_MS = 15000;
unsigned long lastSend = 0;

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  Serial.print("Connecting to WiFi");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 30000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Connected. IP=");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed");
  }
}

bool sendReadings(float temperatureC, float humidityPct, int rssiDbm) {
  if (WiFi.status() != WL_CONNECTED) return false;

  String endpoint = String(MYNCEL_BASE_URL) + "/api/iot/ingest";

  StaticJsonDocument<768> doc;
  JsonArray readings = doc.createNestedArray("readings");

  if (!isnan(temperatureC)) {
    JsonObject temp = readings.createNestedObject();
    temp["type"] = "temperature";
    temp["value"] = temperatureC;
    temp["unit"] = "°C";
  }

  if (!isnan(humidityPct)) {
    JsonObject hum = readings.createNestedObject();
    hum["type"] = "humidity";
    hum["value"] = humidityPct;
    hum["unit"] = "%";
  }

  JsonObject rssi = readings.createNestedObject();
  rssi["type"] = "wifi_rssi";
  rssi["value"] = rssiDbm;
  rssi["unit"] = "dBm";

  String payload;
  serializeJson(doc, payload);

  HTTPClient http;
  http.begin(endpoint);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + MYNCEL_DEVICE_TOKEN);

  int code = http.POST(payload);
  String response = http.getString();
  http.end();

  Serial.print("Myncel response code=");
  Serial.print(code);
  Serial.print(" body=");
  Serial.println(response);

  return code >= 200 && code < 300;
}

void setup() {
  Serial.begin(115200);
  delay(500);
  dht.begin();
  connectWiFi();
}

void loop() {
  connectWiFi();

  if (millis() - lastSend >= SEND_INTERVAL_MS) {
    float temperatureC = dht.readTemperature();
    float humidityPct = dht.readHumidity();
    int rssiDbm = WiFi.RSSI();

    sendReadings(temperatureC, humidityPct, rssiDbm);
    lastSend = millis();
  }

  delay(500);
}
