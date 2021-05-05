var socket = io();

function preload(){
  socket.emit('requestChapter');
}

function setup(){




let slider;

let enteredText = "testname";

let scenes = [];
let chapters = [];


let currentPosition;


let tempWRGB = [];

let activechapter;
let lastscene;


function requestPreviewWRGB(arr){
  socket.emit('requestPreviewWRGB', arr);
  console.log(arr);
}

function requestInsertScene(position){
  socket.emit('requestInsertScene', position);
  // socket.emit('requestchapter');
  console.log(activechapter);
  setTimeout(refreshScreen(), 400);
}

function requestRenameScene(newName, currentPosition){
  socket.emit('requestRenameScene', newName, currentPosition);
  console.log(activechapter);
  setTimeout(refreshScreen(), 400);
}

function requestRenameChapter(newName){
  socket.emit('requestRenameChapter', newName);
  console.log(activechapter);
  setTimeout(refreshScreen(), 400);
}

function requestSaveChapters(){
  socket.emit('requestSaveChapters');
}

function requestLoadChapters(){
  socket.emit('requestLoadChapters');
}


function requestMoveNextStart(currentPosition){
  socket.emit('requestMoveNextStart', currentPosition);
  console.log(activechapter);
  setTimeout(refreshScreen(), 400);
}


function requestMoveThisStart(currentPosition){
  socket.emit('requestMoveThisStart',currentPosition);
  console.log(activechapter);
  setTimeout(refreshScreen(), 400);
}


function requestPosition(){
  socket.emit('requestPosition');
}

function requestRemoveScene(position){
  socket.emit('requestRemoveScene', position);
  // socket.emit('requestchapter');
  setTimeout(refreshScreen(), 200);
  console.log(activechapter);
}

let button, button2;


//TODO GUI:
//rgb swatch + w slider + dropdown matrix + dropdown sonderszene + fade slider


function touchStarted(){
  return false;
}


// function setup() {
  createCanvas(windowWidth*0.99, windowHeight*0.9);

  noLoop();

  button = createButton('add scene');
  button.position(windowWidth/3, windowHeight/10);
  button.mousePressed(function() {requestInsertScene(mapFromDisplay(slider.value()));});
  button.style('background-color:#44c767')

  button2 = createButton('remove scene');
  button2.position(windowWidth/2, windowHeight/10);
  button2.mousePressed(function() {requestRemoveScene(mapFromDisplay(slider.value()));});
  button2.style('background-color:#c74467')

  input = createInput('');
  input.position(windowWidth/3, windowHeight/6.5);
  input.input(myInputEvent);

  function myInputEvent() {
  console.log('you are typing: ', this.value());
  enteredText = this.value();
  }


  button3 = createButton('rename scene');
  button3.position(windowWidth/2, windowHeight/6.5);
  button3.mousePressed(function() {requestRenameScene(enteredText, mapFromDisplay(slider.value()));});
  button3.style('background-color:#2cc8c7')


  buttonRenameChapter = createButton('rename chapter');
  buttonRenameChapter.position(windowWidth*0.6, windowHeight/6.5);
  buttonRenameChapter.mousePressed(function() {requestRenameChapter(enteredText);});
  buttonRenameChapter.style('background-color:#2cc8c7')


  button4 = createButton('set in point');
  button4.position(windowWidth/3, windowHeight/5);
  button4.mousePressed(function() {requestMoveThisStart(mapFromDisplay(slider.value()));});
  button4.style('background-color:#aaaaff')


  button5 = createButton('set out point');
  button5.position(windowWidth/2, windowHeight/5);
  button5.mousePressed(function() {requestMoveNextStart(mapFromDisplay(slider.value()));});
  button5.style('background-color:#aaaaff')

  button5 = createButton('save to disk');
  button5.position(windowWidth*0.75, windowHeight/8);
  button5.mousePressed(function() {
    let r = confirm('save ALL changes to scenes?');
    if(r==false){
      return
    }
    requestSaveChapters()
  });
  button5.style('background-color:#ffaaaa')


  button6 = createButton('read from disk');
  button6.position(windowWidth*0.75, windowHeight/6);
  button6.mousePressed(function() {requestLoadChapters()});
  button6.style('background-color:#aaaaff')


  previewbutton = createButton('preview');
  previewbutton.position(windowWidth*0.5, windowHeight*0.75);
  previewbutton.mousePressed(()=>{
    console.log('requestPreviewWRGB '+[s0.value(),s1.value(),s2.value(),s3.value()],getSelIDX(sel.value()),getSelIDX(sel2.value()),fadeslider.value(),/*s4.value()*/);
    //requestPreviewWRGB([s0.value(),s1.value(),s2.value(),s3.value()])
    socket.emit('requestPreviewWRGB',[s0.value(),s1.value(),s2.value(),s3.value()],getSelIDX(sel.value()),getSelIDX(sel2.value()),fadeslider.value(),/*s4.value()*/);
  });
  previewbutton.style('background-color:#00bb88')

  savelightbutton = createButton('save light');
  savelightbutton.position(windowWidth*0.6, windowHeight*0.75);
  savelightbutton.mousePressed(()=>{
    let r = confirm('save light settings to scene?');
    if(r==false){
      return
    }
    console.log('requestSaveLight',[s0.value(),s1.value(),s2.value(),s3.value()],getSelIDX(sel.value()),getSelIDX(sel2.value()),fadeslider.value(),/*s4.value()*/);
    socket.emit('requestSaveLight',[s0.value(),s1.value(),s2.value(),s3.value()],getSelIDX(sel.value()),getSelIDX(sel2.value()),fadeslider.value(),/*s4.value()*/);
  });
  savelightbutton.style('background-color:#88bb00')

  const arr1 = ["alles","oben","unten","unten halb"];
  const arr2 = ["default","feuer","blitz"];


  function getSelIDX(val){
    let selidx;
    const condition = (element) => element == val;
    selidx = arr1.findIndex(condition);
    if(selidx != -1) return selidx;
    selidx = arr2.findIndex(condition);
    if(selidx != -1) return selidx;
    return "0";
  }



  slider = createSlider(0, windowWidth*0.9, 100);
  slider.position(30, windowHeight/2);
  slider.style('width', windowWidth*0.9+'px');
  socket.on('setslider', function(value){
    currentPosition = value;
    slider.value(map2Display(value));
    if(activechapter) displayValue(value);
    currentscene = lookupScene(value);
    // console.log(lookupScene(value)==lastscene);
    if(currentscene != lastscene) {
      // console.log('should set ui now');
      setLightUiVals(currentscene);
      lastscene = currentscene;
    }
  });


    let d0 = createDiv();
    // let nameArr = ["wslider","rslider","gslider","bslider"];
    d0.style('padding-left: 50px;');
    d0.style('transform-origin: 0 50% 0');
    d0.style('transform: rotate(' + 270 + 'deg);');
    d0.position(windowWidth*0.25 + (0 * windowWidth/35), windowHeight*0.9);
    let s0 = createSlider(0, 255, 1);
    s0.input(()=>{tempWRGB[0]=s0.value();displayLightUI();});
    // s.id = nameArr[i];
    d0.child(s0);

    let d1 = createDiv();
    // let nameArr = ["wslider","rslider","gslider","bslider"];
    d1.style('padding-left: 50px;');
    d1.style('transform-origin: 0 50% 0');
    d1.style('transform: rotate(' + 270 + 'deg);');
    d1.position(windowWidth*0.25 + (1 * windowWidth/35), windowHeight*0.9);
    let s1 = createSlider(0, 255, 1);
    s1.input(()=>{tempWRGB[1]=s1.value();displayLightUI();});
    // s.id = nameArr[i];
    d1.child(s1);

    let d2 = createDiv();
    // let nameArr = ["wslider","rslider","gslider","bslider"];
    d2.style('padding-left: 50px;');
    d2.style('transform-origin: 0 50% 0');
    d2.style('transform: rotate(' + 270 + 'deg);');
    d2.position(windowWidth*0.25 + (2 * windowWidth/35), windowHeight*0.9);
    let s2 = createSlider(0, 255, 1);
    s2.input(()=>{tempWRGB[2]=s2.value();displayLightUI();});
    // s.id = nameArr[i];
    d2.child(s2);

    let d3 = createDiv();
    // let nameArr = ["wslider","rslider","gslider","bslider"];
    d3.style('padding-left: 50px;');
    d3.style('transform-origin: 0 50% 0');
    d3.style('transform: rotate(' + 270 + 'deg);');
    d3.position(windowWidth*0.25 + (3 * windowWidth/35), windowHeight*0.9);
    let s3 = createSlider(0, 255, 1);
    s3.input(()=>{tempWRGB[3]=s3.value();displayLightUI();});
    // s.id = nameArr[i];
    d3.child(s3);

    // let d4 = createDiv();
    // // let nameArr = ["wslider","rslider","gslider","bslider"];
    // d4.style('padding-left: 50px;');
    // d4.style('transform-origin: 0 50% 0');
    // d4.style('transform: rotate(' + 270 + 'deg);');
    // d4.position(windowWidth*0.25 + (13 * windowWidth/35), windowHeight*0.9);
    // let s4 = createSlider(0, 255, 1);
    // s4.input(()=>{displayLightUI();});
    // // s.id = nameArr[i];
    // d4.child(s4);


  tempWRGB = [s0.value(),s1.value(),s2.value(),s3.value()];

  fadeslider = createSlider(0,5000,1)
  fadeslider.position(windowWidth*0.52, windowHeight*0.7);

  sel = createSelect();
  sel.position(windowWidth*0.5, windowHeight*0.8);
  sel.option(arr1[0]);
  sel.option(arr1[1]);
  sel.option(arr1[2]);
  sel.option(arr1[3]);
  sel.changed(()=>socket.emit('setMask', sel.value()));

  sel2 = createSelect();
  sel2.position(windowWidth*0.6, windowHeight*0.8);
  sel2.option(arr2[0]);
  sel2.option(arr2[1]);
  sel2.option(arr2[2]);
  sel2.changed(()=>socket.emit('setSpecialScene', sel2.value()));

  //sel.changed();


  //whiteSlider = createSlider(windowWidth*0.25, windowWidth*0.25)


  socket.on('activeChapter', function(object){
    //if (!lastchapter){lastchapter = object};
    activechapter = object;
    refreshScreen();
    displayValue();
    requestPosition();
    console.log(activechapter);
  })

  function setLightUiVals(scene){
    if(!scene.lightSettings){
      console.log('failure');
      console.log(scene);
      return;
    };
    s0.value(scene.lightSettings.wrgb[0]);
    s1.value(scene.lightSettings.wrgb[1]);
    s2.value(scene.lightSettings.wrgb[2]);
    s3.value(scene.lightSettings.wrgb[3]);
    let selected1 = arr1[scene.lightSettings.matrix];
    let selected2 = arr2[scene.lightSettings.sceneNum];

    console.log('mask '+selected1);
    console.log('scene '+selected2);
    sel.selected(selected1);
    sel2.selected(selected2);
    fadeslider.value(scene.lightSettings.fadetime);
    // s4.value(scene.lightSettings.cree);
    displayLightUI();
  }


function getChapters(){
  for(let i=0;i<chapters.length;i++){
    sel.option(chapters[i].name);
  }
}

function displayLightUI(){
  //tempWRGB = [s0.value(),s1.value(),s2.value(),s3.value()];
  push()
  fill(245);
  noStroke()
  rect(windowWidth*0.22, windowHeight*0.67, windowWidth*0.5, windowHeight*0.2);
  fill(s1.value(),s2.value(),s3.value())
  rect(windowWidth*0.37, windowHeight*0.7, windowWidth*0.1, windowHeight*0.14);
  fill(255,255,255,s0.value())
  rect(windowWidth*0.37, windowHeight*0.7, windowWidth*0.1, windowHeight*0.14);
  pop()
}


function map2Display(value){
    return map(value, 390, 8100, 0, windowWidth*0.9);
}

function mapFromDisplay(value){
    return map(value, 0, windowWidth*0.9, 390, 8100);
}

function displayScenes(){
  for(let i = 0; i<activechapter.scenes.length;i++){
    let padding = 30;
    let ascoord;
    if(i==0){
    ascoord = map2Display(390);
  } else ascoord = map2Display(activechapter.scenes[i].start);
    let nextcoord;
    if(i<activechapter.scenes.length-1){
      nextcoord = map2Display(activechapter.scenes[i+1].start);
    } else nextcoord = map2Display(8100);
    let displayname = activechapter.scenes[i].displayName;

    console.log('from '+ ascoord + ' to ' + nextcoord);
    stroke(getRandomInt(255), getRandomInt(255), getRandomInt(255)); ///this is dumb for debugging purposes
    strokeWeight(5);
    line(ascoord+padding, windowHeight/2.2, ascoord+padding, windowHeight/2.4);
    line(ascoord+padding,windowHeight/2.3,nextcoord+padding,windowHeight/2.3);
    noStroke();
    //rotate(PI*1.98);
    push();
    translate(padding + ascoord + ((nextcoord-ascoord)/2), windowHeight/2.5);
    rotate(PI*1.75);
    text(activechapter.scenes[i].displayName, 0,0);
    pop();
  }
}

function lookupScene(position){
    let pos = constrain(position,390,8100);
    if(activechapter.direction == 'backwards'){
      return lookupBackwards(pos);
    }
    let a, b, c, d;
      c = 0;
      d = activechapter.scenes.length;
    for(c;c<d;c++){
         a = pos;
         b = activechapter.scenes[c].start;
      if (a<b){
        console.log(c);
        return(activechapter.scenes[c-1]);
      }
    }
    return(activechapter.scenes[activechapter.scenes.length-1]);
  }

function lookupBackwards(position){
  let a, b, c, d;
  c = activechapter.scenes.length;
  d = 0;
  for(c;c>0;c--){
    a = activechapter.scenes[c].start;
    b = position;
    if(a>b){
      console.log(c);
      return(activechapter.scenes[c+1]);
    }
  }
  return(activechapter.scenes[0]);
}


function refreshScreen(){
  background(255);
  displayScenes();
  displayLightUI();
  //displayTodo();
}



function touchMoved(){
  //displayLightUI();
  return false;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function displayValue(val){
  push();
  noStroke();
  fill(230);
  rect(0,0,windowWidth/5,windowHeight/3);
  fill(0);
  text("current chapter: " + activechapter.name, windowWidth/80, 20)
  text("current value: " +val, windowWidth/80, 50);
  text("current scene: " + lookupScene(val).displayName, windowWidth/80, 80)
  text("current scene metadata: " + JSON.stringify(lookupScene(currentPosition)), windowWidth/80, 100, windowWidth/10, 140);
  pop();
}




function displayTodo(){
  push();
  noStroke();
  fill(0);
  text("TODO: buttons to either move right or left handlebar to current pos", windowWidth/2, windowHeight/40);
  pop();
}

}

function draw() {

}
