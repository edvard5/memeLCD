
// This example if for processors with LittleFS capability (e.g. RP2040,
// ESP32, ESP8266). It renders a png file that is stored in LittleFS
// using the PNGdec library (available via library manager).

// The test image is in the sketch "data" folder (press Ctrl+K to see it).
// You must upload the image to LittleFS using the Arduino IDE Tools Data
// Upload menu option (you may need to install extra tools for that).

// Don't forget to use the Arduino IDE Tools menu to allocate a LittleFS
// memory partition before uploading the sketch and data!

#include <esp-fs-webserver.h>  // https://github.com/cotestatnt/esp-fs-webserver
#include <esp-fs-webserver.cpp>
#include <ESPmDNS.h>
#include <PNG_FS_Support.cpp>
int period=3000;
int i=0;
int x=0;
int pngc=1;
unsigned long timex=millis();
int stop=0;
int nx;
//====================================================================================
//                                   WEBSERVER Setup
//====================================================================================
bool apMode = false;
WebServer server(80);
FSWebServer myWebServer(FileSys, server);

////////////////////////////////  Filesystem  /////////////////////////////////////////
void startFilesystem(){
  // FILESYSTEM INIT
  FileSys.begin();
  if (!FileSys.begin()) {
    Serial.println("LittleFS initialisation failed!");
    while (1) yield(); // Stay here twiddling thumbs waiting
    Serial.println("ERROR on mounting filesystem. Restarting ESP");
    delay(2000);
    ESP.restart();
  }  
  else {
    File root = FileSys.open("/", "r");
    File file = root.openNextFile();
    while (file){
      const char* fileName = file.name();
      size_t fileSize = file.size();
      Serial.printf("FS File: %s, size: %lu\n", fileName, (long unsigned)fileSize);
      file = root.openNextFile();
    }
    Serial.println();
  }
}

////////////////////////////  HTTP Request Handlers  ////////////////////////////////////
void handlepause() {
  WebServerClass* webRequest = myWebServer.getRequest();

  // http://xxx.xxx.xxx.xxx/led?val=1
  if(webRequest->hasArg("val")) {
    int value = webRequest->arg("val").toInt();
    stop = value;
  }
  String reply = "memeLCD status ";
  reply += stop ? "Paused" : "Resumed";
  webRequest->send(200, "text/plain", reply);
}

void getDefaultValue() {
  WebServerClass* webRequest = myWebServer.getRequest();
  // Send to client default values as JSON string because it's very easy to parse JSON in Javascript
  String defaultVal = "{\"period\":3}";
  webRequest->send(200, "text/json", defaultVal);
}

void handlePeriodSet() {
  WebServerClass* webRequest = myWebServer.getRequest();
  if(webRequest->hasArg("imageperiod")) {
    int value = webRequest->arg("imageperiod").toInt();
    period = value * 1000;
  }
  String reply = "Slideshow period set to: ";
  reply += period;
  Serial.println(reply);
  webRequest->send(200, "text/plain", reply);
}


//====================================================================================
//                                    Setup
//====================================================================================
void setup()
{
  Serial.begin(9600);
  Serial.println("\n\n Using the PNGdec library");
  // Initialise FS
  startFilesystem();


  // Initialise WEBserver
  // Try to connect to flash stored SSID, start AP if fails after timeout
  IPAddress myIP = myWebServer.startWiFi(15000, "ESP8266_AP", "123456789" );

  // Add custom page handlers to webserver
  myWebServer.addHandler("/getDefault", HTTP_GET, getDefaultValue);
  myWebServer.addHandler("/memelcd", HTTP_GET, handlepause);
  myWebServer.addHandler("/setperiod", HTTP_POST, handlePeriodSet);
  // Start webserver
  if (myWebServer.begin()) {
    Serial.print(F("ESP Web Server started on IP Address: "));
    Serial.println(myIP);
    Serial.println(F("Open /setup page to configure optional parameters"));
    Serial.println(F("Open /edit page to view and edit files"));
    Serial.println(F("Open /update page to upload firmware and filesystem updates"));
  }

  // Initialise the TFT
  tft.begin();
  tft.fillScreen(TFT_BLACK);
  tft.setRotation(0);

  timex = millis();
  Serial.println("\r\nInitialisation done.");


  if (!MDNS.begin("memelcd")) {
    Serial.println("Error setting up MDNS responder!");
    while(1) {
      delay(1000);
        }
    }
  MDNS.addService("http", "tcp", 80);

}


//====================================================================================
//                                    Loop
//====================================================================================
void loop()
{
    
    //====== Count png files ============
    if(i==0){
    File root = FileSys.open("/", "r");
        while (File file = root.openNextFile()) {
            String strname = file.name();
            strname = "/" + strname;
            if (!file.isDirectory() && strname.endsWith(".png")) {
                pngc++;
                }
        }
    nx=1;
    }
    String listpng[pngc];
    //===================================

  while(nx!=0){
    //============ FSbrowser ============
    myWebServer.run();
    //===================================

    //============ Load PNG into array =============
    if(i<(sizeof(listpng)/sizeof(listpng[0]))-1){
        File root = FileSys.open("/", "r");
        while (File file = root.openNextFile()) {
            String strname = file.name();
            strname = "/" + strname;
            // If it is not a directory and filename ends in .png then load it ( to load all files into serial use //Serial.println(file.name()); )
            if (!file.isDirectory() && strname.endsWith(".png") && i<(sizeof(listpng)/sizeof(listpng[0]))) {
                listpng[i] = strname;
                Serial.printf("Loaded img: %s as number: %d\n" , listpng[i] , i);
                i++;
                }
                else{
                x=i-1;
                }
            }
        }

    //============ Show image on screen ============
    if(x>=0){
        if(millis()-timex>=period){
            // Pass support callback function names to library
            if(stop==0){
            int16_t rc = png.open(listpng[x].c_str(), pngOpen, pngClose, pngRead, pngSeek, pngDraw);
            if (rc == PNG_SUCCESS) {
                tft.startWrite();
                Serial.printf("image specs: (%d x %d), %d bpp, pixel type: %d\n", png.getWidth(), png.getHeight(), png.getBpp(), png.getPixelType());
                rc = png.decode(NULL, 0);
                png.close();
                }
            tft.endWrite();
            x--;
            }  
            timex=millis();
        }
    }
    else{
        pngc=1;
        i=0;
        nx=0;
        Serial.println("return to scan");   
    }
  }

}
