/* NEOPIXEL Setup *******************************************************
 *  
 */
 #include <Adafruit_NeoPixel.h>
#ifdef __AVR__
 #include <avr/power.h> // Required for 16 MHz Adafruit Trinket
#endif
#define LED_PIN    6
#define CREE_PIN   13
#define LED_COUNT 120  
// auf Mega: LED_COUNT 300=> 50% RAM
// auf UNO: LED_COUNT 100=> 93% RAM

/* Serial Protokoll *****************************************************************
*  's',scene,defW,defR,defG,defB,cree,matrixPreset,transitionTime,masterFade,fx,'/n'
*  
*********************************************************************************** */
boolean debug=false;

Adafruit_NeoPixel pixels(LED_COUNT, LED_PIN, NEO_RGBW + NEO_KHZ800);
// Argument 3 = Pixel type flags, add together as needed:
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)
//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)
//   NEO_RGBW    Pixels are wired for RGBW bitstream (NeoPixel RGBW products)


/* to be set on scene change *******************************************************
 *  
 */
 
int currentScene;
int transitionTime; // how long to transition from last scene state to current
int masterFade; // 0-255
byte defWRGB [4]; // WRGB used as default color value for all Leds, if there is no scene specific function
byte defCree; //0-255 brightness value for CREE
int fx; // 0-255 generic parameter to control fx strength, to be uses (or not used) by scenes
byte activePixelMap[LED_COUNT]; // 0/1: use or don't use pixel




/* state variables *********************************************************************
 * 
 */
 
boolean isTransitioning=false;
boolean newScene=false;
long int transitionStarted; //when the transition started (milliseconds)
//stores last scene data
byte lastScene; 
byte lastWRGB[4];
byte lastPixelMap[LED_COUNT];
byte lastCreeDef; // not used until now
int  lastFx;
int  lastMasterFade;

// pixel value storage
byte pixCurrent [LED_COUNT][4]; // [pixelnum][ W R G B ]
byte pixLast [LED_COUNT][4];// [pixelnum][ W R G B ]
byte creeVal;
byte creeLast;
byte bp[4]; // used by the blendPixel function
byte rp[4]; // used by the getPixel function



void setup() {
    // These lines are specifically to support the Adafruit Trinket 5V 16 MHz.
    // Any other board, you can remove this part (but no harm leaving it):
    #if defined(__AVR_ATtiny85__) && (F_CPU == 16000000)
      clock_prescale_set(clock_div_1);
    #endif
      // END of Trinket-specific code.
    pixels.begin();           // INITIALIZE NeoPixel strip object (REQUIRED)
    pixels.show();            // Turn OFF all pixels ASAP
    pixels.setBrightness(255); 
    
    Serial.begin(2400);
    // temp, switch as secene selector;
    pinMode( 2, INPUT_PULLUP); 
    pinMode( 3, INPUT_PULLUP);

  Serial.println("START");  
    // debug:
    //Serial.println("Initial Scene for Debugging");
    newScene=true;
    currentScene=100;// Fire
    masterFade=255;
    fx=100;
    transitionTime=2000;
    defWRGB[0]=50;
    defWRGB[1]=50;
    defWRGB[2]=50;
    defWRGB[3]=50;
    defCree=125;
      for (int i=0;i<LED_COUNT;i++){
        activePixelMap[i]=(byte)0;
      }   
      for (int i=0;i<20;i++){
        activePixelMap[i]=(byte)1;
      }
  
}


void loop() {
  processInput();
  checkForNewScene(); // see functions.ino
  calcScene(pixCurrent,currentScene,activePixelMap);// TODO: include refrence to CREE
  calcScene(pixLast,lastScene,lastPixelMap); // TODO: include refrence to CREE
//  if (isTransitioning){
//    calcScene(pixLast,lastScene,lastPixelMap); 
//  }
  render();
}

/*
/* INSERT  Calls to special Scenes functions here--------------------------------*/






  

/* 'Private' functions */


void calcSceneDefault(byte matrix[][4], byte pmap[]){
   // ? evaluate Pixelmap here??
  }


 

void startSceneDefault() {
  // fill current matrices with new values
  for (int i=0;i<LED_COUNT;i++){
      memcpy(pixCurrent[i], defWRGB, sizeof defWRGB);
      if (activePixelMap[i]==0){
        byte tmp[]={0,0,0,0};
        memcpy(pixCurrent[i], tmp, sizeof tmp);
      }
  } 
  creeVal=defCree; 
} 

void storeLastScene(){
  // copy values from current to last
  lastScene=currentScene;
  creeLast==creeVal;
  memcpy(pixLast, pixCurrent, sizeof pixCurrent);
  memcpy(lastPixelMap, activePixelMap, sizeof activePixelMap);
} 


void render(){
    byte creeOut;
    pixels.clear(); // Set all pixel colors to 'off'

    // TODO: apply PixelMpas to both matrices (pixCurrent, pixLast);
    
    if (isTransitioning){
        int elapsed=millis()- transitionStarted;
        float rel=(float)255* elapsed/transitionTime;
        byte mix= (byte) rel;
        //Serial.print("T ");
        //Serial.println(mix);
        if (elapsed>=transitionTime){
          isTransitioning=false;
          mix=255;
        }
        for (int i=0;i<LED_COUNT;i++){
             blendPixel(i,mix);
             pixels.setPixelColor(i,bp[2], bp[1], bp[3],bp[0]); // fixes r/g dreher
        }
        byte c1=creeLast;
        byte c2=creeVal;
        creeOut=blendByte (c1,c2, mix);
    }
    else{
      for (int i=0;i<LED_COUNT;i++){
       byte w=pixCurrent[i][0];
       byte r=pixCurrent[i][1];
       byte g=pixCurrent[i][2];
       byte b=pixCurrent[i][3];
       pixels.setPixelColor(i, g, r, b,w); //fixes r/g dreher
      }
      creeOut=creeVal;
    }
    // TODO: implement masterFade
     pixels.show();
     analogWrite(CREE_PIN, creeOut); // TODO: CHECK
  }

void blendPixel (int pixelAddress, byte mix){
        // TODO schneller und eleganter machen
         byte w1=pixLast[pixelAddress][0];
         byte r1=pixLast[pixelAddress][1];
         byte g1=pixLast[pixelAddress][2];
         byte b1=pixLast[pixelAddress][3]; 
         byte w2=pixCurrent[pixelAddress][0];
         byte r2=pixCurrent[pixelAddress][1];
         byte g2=pixCurrent[pixelAddress][2];
         byte b2=pixCurrent[pixelAddress][3];
         bp[0]=blendByte (w1,w2, mix);
         bp[1]=blendByte (r1,r2, mix);
         bp[2]=blendByte (g1,g2, mix);
         bp[3]=blendByte (b1,b2, mix);
  }
  
byte blendByte (byte a, byte b, byte mix){
   // TODO schneller und eleganter machen
   int ap=a*(255-mix);
   int bp=b*mix;
   int result= (ap + bp)/255;
   byte out= (byte) result;
   return out;
  }




  
void processInput(){
  //'s',scene,defW,defR,defG,defB,cree,matrixPreset,transitionTime,masterFade,'/n'
  static char serBuffer[36]; // stores the received Serial
  static size_t pos;
  static char command;
  boolean msgReceived=false;
  char * pch;
  
  while (Serial.available() && pos < sizeof serBuffer - 1) {
        // Read incoming byte.
        char c = Serial.read();
        serBuffer[pos++] = c;
        // Echo received message.
        if (c == '\n') {            // \n means "end of message"
            serBuffer[pos] = '\0';     // terminate the serBuffer
             Serial.println(serBuffer);
             msgReceived=true;
//            if(checkPacket(serBuffer,pos)){
//              msgReceived=true;
//              Serial.println(serBuffer);
//            } else 
//            { 
//              Serial.println("ERR"); 
//            }
            pos = 0; // reset to start of serBuffer
            //if(debug==true){Serial.println(serBuffer); } // send echo
        }
    }
  if (pos >= sizeof serBuffer - 1){
    // ssomething went wirng. Discard message.
    pos=0;
    msgReceived=false;
  }
  
  // process serBuffer
  if (msgReceived && serBuffer[0]=='s'){  // sceneChange command received, processing data
    msgReceived=false;
    storeLastScene(); // copy current scene Data to 'last' before we overwirte
    command=*strtok(serBuffer, ",");
    pch=strtok(NULL, ",");
    currentScene = atoi(pch);
    pch=strtok(NULL, ",");
    defWRGB[0]=(byte) atoi(pch);
    pch=strtok(NULL, ",");
    defWRGB[1]=(byte) atoi(pch);
    pch=strtok(NULL, ",");
    defWRGB[2]=(byte)  atoi(pch);
    pch=strtok(NULL, ",");
    defWRGB[3]=(byte) atoi(pch);
    pch=strtok(NULL, ",");
    defCree=(byte)  atoi(pch);
    pch=strtok(NULL, ",");
    int matrixPreset = atoi(pch);
    pch=strtok(NULL, ",");
    transitionTime = atoi(pch);
    //Serial.println(matrixPreset);  // send echo
    // now, fill pixelMap
    setPixelMap (matrixPreset);  
    pch=strtok(NULL, ",");
    masterFade =  atoi(pch);
    pch=strtok(NULL, ",");
   // memset(serBuffer,"",512);
    //Serial.println("OK");  // send echo
    msgReceived=false;
    newScene=true; 
  }
  if (msgReceived && serBuffer[0]=='f'){
    // TODO OPTIONAL handle fx/whatever command
    //Serial.println("ERR cmd f");
    msgReceived=false;
  }
  else if (msgReceived){
    // no valid command found in Serial Message
    //Serial.println("ERR undef cmd");
    msgReceived=false;
  }
 
  checkButtons() ; // check Buttons on IO pins
}

boolean checkPacket (byte buf[], size_t pos){
        // this is really just a totally rudimentary implementation.
        if (pos<3){return false;}// message is to short to make any sense.
        return true;
//        byte checksum=buf [pos-1];
//        byte c;
//        for (int i=0; i<=pos-2){
//          
//        }
}



void checkButtons(){
   // TODO: Button Middle position should do nothing in Final Version, just one "est" Postion on switch to check all Lights.
  static int button1State=0;
  static int button2State=0;
  int pin1State=digitalRead(2);
  int pin2State=digitalRead(3);
  if (button1State==pin1State&&button2State==pin2State)
  {return;}
  button1State=pin1State;
  button2State=pin2State;
  
  storeLastScene(); // current scenes needs to be copied to last scene, before we overwrite pix arrays with new values

  if (button1State==1&&button2State==0){
    //Serial.println("Button 1");
    newScene=true;
    currentScene=0; // Alles an
    
    transitionTime=2000; 
    masterFade=255;
    fx=100;
    defWRGB[0]=255;
    defWRGB[1]=0;
    defWRGB[2]=0;
    defWRGB[3]=0;
    defCree=255;
    setPixelMap (255); // all on
  }

  else if (button1State==0&&button2State==1){
  //Serial.println("Button 2");
  // TODO: Use for Blitz effetkt
  // TODO: write Blitz effekt
  newScene=true;
  currentScene=99; 
  transitionTime=2000; 
  masterFade=255;
  fx=100;
  defWRGB[0]=0;
  defWRGB[1]=0;
  defWRGB[2]=0;
  defWRGB[3]=0;
  defCree=0;
  setPixelMap(255); // nur Auflicht
  }

   else {
  // for testing: hardcoded Settings 2
  // Serial.println("Button None(Middle)");
  newScene=true;
  currentScene=1;// Fire
    transitionTime=2000; 
    masterFade=255;
    fx=100;
    defWRGB[0]=0;
    defWRGB[1]=0;
    defWRGB[2]=0;
    defWRGB[3]=0;
    defCree=0;
    setPixelMap(2); // nur Vertikale
  }
}

void debugMsg(){
  if (debug!=true){return;}
      Serial.print("Scene:");
      Serial.print(currentScene);
      Serial.print("last:");
      Serial.println(lastScene);
      Serial.print("C: ");
      Serial.print(defCree);
      Serial.print(" W");
      Serial.print(defWRGB[0]);
      Serial.print(" R");
      Serial.print(defWRGB[1]);
      Serial.print(" G");
      Serial.print(defWRGB[2]);
      Serial.print(" B");
      Serial.println(defWRGB[3]);
}
