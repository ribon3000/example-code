void checkForNewScene(){
    /*
   * function calls for special scenes init go here.....
   */
    if (!newScene){return;}
    newScene=false;
    transitionStarted=millis();
    isTransitioning=true;
    switch (currentScene){
    //case 100:
    //mode fire, do nothing (yet)
    //break;
      default:
      startSceneDefault();
      break;
    }
    if (debug){
       debugMsg();
    } 
}

void calcScene(byte matrix[][4], int scene, byte pmap []){
         /*
         * function calls for special scenes updates go here
         */
        switch (scene){
          case 1:
         //mode fire
          modeFire(matrix, 58,120,40);
          break;
          default:
          calcSceneDefault(matrix,pmap);
          break;
        }
        // switch off pixels according to MAP
       for (int i=0;i<LED_COUNT;i++){
          if (pmap[i]==0){
          byte tmp[]={0,0,0,0};
          memcpy(matrix[i], tmp, sizeof tmp);
      }
  } 
}

/* END Calls to special Scenes --------------------------------  */



void setPixelMap (int id){
         /*
         * function calls for special scenes updates go here
         */
        switch (id){

           case 1:
           // auflicht/horizontale on
           for (int i=0;i<LED_COUNT;i++){
            activePixelMap[i]=0;
           }
           for (int i=61;i<120;i++){
            activePixelMap[i]=1;
           }
          break;
          
          case 2:
           // vertikale on
           for (int i=0;i<LED_COUNT;i++){
            activePixelMap[i]=0;
           }
           for (int i=0;i<60;i++){
            activePixelMap[i]=1;
           }
          break;
          
          case 3:
           // vertikale halb on
           for (int i=0;i<LED_COUNT;i++){
            activePixelMap[i]=0;
           }
           for (int i=0;i<30;i++){
            activePixelMap[i]=1;
           }
          break;

          
          default:
           //all on
           for (int i=0;i<LED_COUNT;i++){
            activePixelMap[i]=1;
           }
          break;
          
        }

}

/* "Public" functions */   
// Call this form CalcScene functions 
void setPix (byte matrix[][4], int address, byte r, byte g, byte b, byte w=0){
  
  matrix[address][0]=w; 
  matrix[address][1]=r; // TODO: this is odd, but works. somewhre else r & g must be switched...?
  matrix[address][2]=g; // TODO: this is odd, but works. somewhre else r & g must be switched...?
  matrix[address][3]=b;
}
void getPix (byte matrix[][4], int address){
  // TODO: not tested yet
  static byte pix[4];
  rp[0]=matrix[address][0];//w
  rp[1]=matrix[address][1];//r
  rp[2]=matrix[address][2];//g
  rp[3]=matrix[address][3];//b
}
