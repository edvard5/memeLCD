// memeLCD https://github.com/edvard5/memeLCD
// created by edvard5
//==============================================================================

#include <esp-fs-webserver.h>
#include <esp-fs-webserver.cpp>
#include <ESPmDNS.h>
#include <PNG_FS_Support.cpp>

//==============================================================================
//                                 Variables
//==============================================================================
int firep1=19;                      // Pin for fire pit bowl LED1
int firep2=21;                      // Pin for fire pit bowl LED2
int period=3000;                    // Time how frequently image changes
int i=0;                            // Image counter variable
int x=0;                            // Reverse image counter from last to first
int pngc=1;                         // PNGs counter for array of listpng
unsigned long timex=millis();       // Timer for how frequently image changes
unsigned long timefire=millis();    // Timer for how frequently fire pit bowl refreshes
int stop=0;                         // Pause variable
int nx;                             // Variable showing if all images have been shown
int fBrightness=67;                 // firebrightness starting value
int rfBrightness=120;               // random fire brightness starting max value
int ffx=0;                          // effect toggle for fire max power when image change occurs
int lastrfB;                        // last known value for last fire
//==============================================================================


//==============================================================================
//                                   WEBSERVER Setup
//==============================================================================
bool apMode = false;
WebServer server(80);
FSWebServer myWebServer(FileSys, server);
//==============================================================================


//==============================================================================
//                                   Filesystem setup
//==============================================================================
void startFilesystem(){
  // FILESYSTEM INIT
  FileSys.begin();
  if (!FileSys.begin()) {
    Serial.println("LittleFS initialisation failed!");
    while (1) yield(); 
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
//==============================================================================


//==============================================================================
//                                   HTTP Request Handlers
//==============================================================================
void handlepause() {
  WebServerClass* webRequest = myWebServer.getRequest();
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

void handlefbrightness(){
  WebServerClass* webRequest = myWebServer.getRequest();
  if(webRequest->hasArg("bval")){
    int value = webRequest->arg("bval").toInt();
    fBrightness = value * 1.08; // daugiklis kad 100%=135PWM
    Serial.println(fBrightness);
  if(value==0){
    rfBrightness = value;
  }
  else
    rfBrightness = value * 0.96;
  }
}

void handlefeffect(){
  WebServerClass* webRequest = myWebServer.getRequest();
  if(webRequest->hasArg("fxval")){
    int value = webRequest->arg("fxval").toInt();
    ffx = value;

  }
}
//==============================================================================


//==============================================================================
//                                    Setup
//==============================================================================
void setup()
{
  // Initialise serial for debugging
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
  myWebServer.addHandler("/myRange", HTTP_GET, handlefbrightness);
  myWebServer.addHandler("/ffx", HTTP_GET, handlefeffect);

  // Start webserver
  if (myWebServer.begin()) {
    Serial.print(F("ESP Web Server started on IP Address: "));
    Serial.println(myIP);
    Serial.println(F("Open /setup page to configure WIFI settings"));
    Serial.println(F("Open /edit page to view and edit files in FSbrowser"));
    Serial.println(F("Open /update page to upload firmware and filesystem updates"));
  }

  // Initialise  TFT screen
  tft.begin();
  tft.fillScreen(TFT_BLACK);
  tft.setRotation(0);

  // Initialise local mDNS
  if (!MDNS.begin("memelcd")) {
    Serial.println("Error setting up MDNS responder!");
    while(1) {
      delay(1000);
        }
    }
  MDNS.addService("http", "tcp", 80);

  // Additional outputs and variable sets
  pinMode(OUTPUT,firep1);
  pinMode(OUTPUT,firep2);
  timex = millis();
  Serial.println("\r\nInitialisation done.");
}
//==============================================================================


//==============================================================================
//                                    Loop
//==============================================================================
void loop(){
    
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

    //============ Fire pit fx ==========
    if(millis()-timefire>100){
      analogWrite(firep1,lastrfB = random(rfBrightness)+fBrightness);
      analogWrite(firep2,random(rfBrightness)+fBrightness);
      timefire=millis();
    }
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
            if(ffx==1){
              for(int glow=lastrfB ; glow <= 255; glow++ ){  
                analogWrite(firep1,glow);
                analogWrite(firep2,glow);
                delay(1);
              }
            }
            if (rc == PNG_SUCCESS) {
                tft.startWrite();
                Serial.printf("image specs: (%d x %d), %d bpp, pixel type: %d\n", png.getWidth(), png.getHeight(), png.getBpp(), png.getPixelType());
                rc = png.decode(NULL, 0);
                png.close();
                }
            tft.endWrite();
              if(ffx==1){
                for(int glow=255 ; glow>=lastrfB ; glow--){  
                analogWrite(firep1,glow);
                analogWrite(firep2,glow);
                delay(1);
                }
              }
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
