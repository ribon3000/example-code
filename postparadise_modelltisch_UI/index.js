const path = require('path');
const fs = require('fs');
const Max = require('max-api');
const express = require('express')
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);
const sceneManager = require('./scenemanager.js');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');


// global scope declarations yay


const port = new SerialPort('COM6',{
  baudRate: 2400
}, function (err) {
  if (err) {
    return console.log('Error: ', err.message + "\n - - - - - ")
  }
});

let lastMessage;
let errs = 0;





//SYNTAX: "s",$scenenum,W,R,G,B,creeVal,matrixPreset(0123),fadeTimeinMS,masterFade,fx,\n
//
//return string ist: wenn mit "s" beginnt "OK" wenn mit "f" beginnt "error command f" else "error unknown command";
//wenn paket weniger als 15 bytes "error"

//matrix preset syntax:
//case 0 => alles an
//case 1 => oben an
//case 2 => nur senkrechte konsole an
//case 3 => nur senkrechte zur hälfte an
//undefined => alles an




//TODO GUI:
//rgb swatch + w slider + dropdown matrix + dropdown sonderszene + fade slider


setTimeout(()=>{port.write('s,1,125,255,50,200,50,99,1000,1,\n', function(err) {
  if (err) {
    return console.log('Error on write: ', err.message)
  }
  console.log('message written')
	lastMessage = 's,1,125,255,50,200,50,99,1000,1,\n';
})},1200);





const parser = port.pipe(new Readline({ delimiter: '\r\n' }))
parser.on('data', (data) => {console.log("data: "+ data)})
parser.on('data', (data)=>{
	if (data != lastMessage){
		console.log('wrong data: '+data);
		errs += 1;
		console.log('errs: '+ errs);
	}
	// if(data == 'OK'){
	// 	console.log('it worked!');
	// 	setTimeout(()=>{port.write('meep,\n');},500);	}
	// if(data == 'ERR'){
	// 	console.log('it worked!');
	// 	setTimeout(()=>{port.write('f,1,125,255,50,200,1,99,1000,1,\n');},500);
	// }
	// if(data == 'ERR cmd f'){
	// 	console.log('it worked!');
	// 	setTimeout(()=>{port.write('t,1,125,255,50,200,1,99,1000,1,\n');},500);
	// }

});


//setTimeout(()=> {console.log(port);},1200);


let saveFile = fs.readFileSync('chapters.json');


SerialPort.list().then(ports => {
    ports.forEach(function(port) {
        console.log('port path: '+port.path)
    })
})



function readChapters(){
	let parsed = JSON.parse(saveFile);
	chapters = parsed;
	sceneManager.chapters = parsed;
	currentChapter = sceneManager.changeChapter(currentChapterIndex);
	//console.log('read from disk');
	//console.log(JSON.stringify(parsed));
}

function getSavedChapters(){
	return JSON.parse(saveFile);
	console.log(JSON.stringify(saveFile));
}

function writeChapters(){
	//fs.writeFileSync('chapters.json', JSON.stringify(chapters));
	//Max.post('saved to disk');
	Max.post(JSON.stringify(chapters));
	chapters = sceneManager.chapters;
	fs.writeFile('chapters.json', JSON.stringify(sceneManager.chapters), (err) => {
    if (err) throw err;
    Max.post('Data written to file');
});
}


function clamp(num, min, max){
	return Math.min(Math.max(num, min), max);
}

let currentValue = 0;
let chapters = sceneManager.chapters;
let currentChapter = sceneManager.changeChapter(0);
let currentChapterIndex = 0;
let activeSceneIndex = 0;
let activeScene = currentChapter.scenes[0];

//readChapters();

Max.addHandler("changeChapter", (int) =>{
	if(int > chapters.length-1) {return};
	currentChapterIndex = int;
	currentChapter = sceneManager.changeChapter(int);
	setTimeout(() => {io.emit('activeChapter', currentChapter)}, 100);
	sendDeckChange(int+1);
  //test
  // will a timeout help? eh... mabye, unless we're not passing the if condition
  console.log(currentChapter.name);
  setTimeout(()=>{setSlider(currentValue);},100);
  //test
  console.log(activeScene.displayName);

  let currentScene = sceneManager.lookupScene(currentChapter,currentValue);
  activeScene = currentScene;

  console.log(activeScene.displayName);

  let pos = currentScene.start;
  pos = clamp(pos,390,8100);
  let activeSc = sceneManager.getIndex(currentChapter.scenes, 'start', pos);

  Max.outlet("/composition/columns/" + (activeSc + 1) + "/connect 1");
  activeSceneIndex = activeSc;
  sendLightScene();
  console.log(activeSc);

	setTimeout(()=>{sendColumnNames()},100);
});

// This will be printed directly to the Max console
Max.post(`Loaded the ${path.basename(__filename)} script`);


Max.addHandler("setslider", (value) =>{
  setSlider(value);
});

function setSlider(value){
  io.emit("setslider", value);
  let val = value;
  val = clamp(val,390,8100);
  currentValue = val;
  let currentScene = sceneManager.lookupScene(currentChapter,val);
  activeScene = currentScene;
  //Max.post(JSON.stringify(currentScene));
  //Max.post(activeScene.start);
  //sC(currentChapter.scenes.findIndex(item => item['start'] === currentScene.start));
  let pos = currentScene.start;
  pos = clamp(pos,390,8100);
  let activeSc = sceneManager.getIndex(currentChapter.scenes, 'start', pos);
  sC(activeSc);
  sendTransport(val);
  sendTransform(val);
}

app.use(express.static('public'));

io.on('connection', (socket) => {
  Max.post('a user connected');

	socket.on('requestChapter', () =>{
		io.emit('chapters', chapters);
		io.emit('activeChapter', currentChapter);

	});

	socket.on('requestSaveLight', (wrgb,mask,scene,fade,/*cree*/) =>{
		activeScene.lightSettings = {
			sceneNum: scene,
			wrgb: wrgb,
			// cree: cree,
			matrix: mask,
			fadetime: fade,
			masterfade: 0,
			fx: 0
		}
		setTimeout(()=> {
			io.emit('chapters', chapters);
			io.emit('activeChapter', currentChapter);
		},100);
	});

	socket.on('requestPreviewWRGB', (wrgb,mask,scene,fade,/*cree*/) =>{
    //NOTE: replaced cree with static 0
		var previewMessage = 's,'+scene+',' + wrgb[0] +',' + wrgb[1] + ',' + wrgb[2] + "," + wrgb[3] + ','+'0'+','+ mask +',20,1,\n';
		port.write(previewMessage, function(err) {
	  if (err) {
	    return console.log('Error on write: ', err.message)
	  }
		console.log('message: '+previewMessage);
		lastMessage = previewMessage;
	})});

	socket.on('setMask', (string) =>{
		//here we should set the current chapters' mask according to what string we're matching
	});

	socket.on('setSpecialScene', (string)=>{
		//here we should set the current chapters' special scene acording to what string we're matching
	});

	socket.on('setChapter', (name)=>{
		currentChapter = chapters[sceneManager.getIndex(sceneManager.chapters,'name',name)];
		io.emit('chapters', chapters);
		io.emit('activeChapter', currentChapter);
	});

	socket.on('requestSaveChapters', ()=>{
		writeChapters();
	});

	socket.on('requestLoadChapters', ()=>{
		readChapters();
		setTimeout(()=> {
			io.emit('chapters', chapters);
			io.emit('activeChapter', currentChapter);
		},100);
	});


	socket.on('requestRenameScene', (newName, position) =>{
		sceneManager.renameScene(currentChapter, position, newName);
		Max.post('renaming at ' + position + " to " + newName);
		setTimeout(() => {io.emit('activeChapter', currentChapter)}, 100);
		sendColumnNames();
	});


  socket.on('requestRenameChapter', (newName) =>{
    sceneManager.renameChapter(currentChapter, newName);
    setTimeout(() => {io.emit('activeChapter', currentChapter)}, 100);
    sendColumnNames();
  });

	socket.on('requestPosition', () =>{
		io.emit('setslider', currentValue);
	});

	socket.on('requestInsertScene', (position) =>{
		sceneManager.insertScene(currentChapter, position);
		setTimeout(() => {io.emit('activeChapter', currentChapter)}, 100);
	});


	socket.on('requestMoveThisStart', (position) =>{
		sceneManager.setStartAKApreviousEnd(currentChapter, position);
		Max.post('moving current start to ' + position);
		setTimeout(() => {io.emit('activeChapter', currentChapter)}, 100);
	});

	socket.on('requestMoveNextStart', (position) =>{
		sceneManager.setEndAKAnextStart(currentChapter, position);
		Max.post('moving current end to ' + position);
		setTimeout(() => {io.emit('activeChapter', currentChapter)}, 100);
	});

	socket.on('requestRemoveScene', (position) =>{
		sceneManager.removeScene(currentChapter, position);
		setTimeout(() => {io.emit('activeChapter', currentChapter)},100);
	});


  socket.on('chat message', (msg) => {
  console.log('message: ' + msg);
  Max.post('message: ' + msg);
  //Max.outlet('message: ' + msg);
});
  socket.on('disconnect', () => {
    Max.post('user disconnected');
  });
});

http.listen(3000, () => {
  Max.post('listening on *:3000');
});

Max.setDict("id", currentChapter)


function sendDeckChange(value){
	Max.outlet("/composition/decks/"+value+"/select 1");
}

function sendColumnNames(){
	for(let i = 0; i < currentChapter.scenes.length; i++){
		Max.outlet("/composition/layers/7/clips/"+(i+1)+"/video/source/blocktextgenerator/text " + currentChapter.scenes[i].displayName);
	}
}

///IMPORT FROM OLD MAXPATCH

function sC(scenenum){
	if(scenenum != activeSceneIndex){
	Max.outlet("/composition/columns/" + (scenenum + 1) + "/connect 1");
	sendLightScene();
	}
	activeSceneIndex = scenenum;
}

function sendLightScene(){
	if(!activeScene.lightSettings){return};
	let ls = activeScene.lightSettings;
	let wrgb = ls.wrgb;
	//let newMessage = "test";
	console.log('ls: '+ls);
	let newMessage = ('s,'+ls.sceneNum+','+ wrgb[0] +',' + wrgb[1] + ',' + wrgb[2] + ',' + wrgb[3] + ','+ls.cree+','+ ls.matrix +','+ls.fadetime+','+ls.masterfade+',\n');
	port.write(newMessage, function(err) {
	if (err) {
		return console.log('Error on write: ', err.message)
		}
	console.log('message written: '+newMessage)
	lastMessage = newMessage;
	});
}

function sendTransport(value)
{
	let end = 8100;
	if(activeSceneIndex < currentChapter.scenes.length-1){
		end = currentChapter.scenes[activeSceneIndex+1].start;
		//Max.post(end);
	} //else { Max.post("else"); return;/*end = currentChapter.scenes[currentChapter.scenes.length].start*/}
	let start = activeScene.start;
	var newvalue = scaleTransport(start, end, value);
	//Max.post(start, end, value, newvalue);
	Max.outlet("/composition/layers/1/clips/"+ (activeSceneIndex + 1) + "/transport/position " + newvalue);
	Max.outlet("/composition/layers/4/clips/"+ (activeSceneIndex + 1) + "/transport/position " + newvalue);

}


function sendTransform(value)
{
	let newtransform = map(value, 390, 8100, 0.564757, 0.377261);
	Max.outlet("/composition/layers/2/video/effects/transform/positionx " + newtransform);
	Max.outlet("/composition/layers/5/video/effects/transform/positionx " + newtransform);
}


const map = function(n, start1, stop1, start2, stop2) {
  return ((n-start1)/(stop1-start1))*(stop2-start2)+start2;
};

function scaleTransport(start, end, value)
{
		//return value;
		return ((value-start) / (end - start));
}






// -- utility functions i've only used once or twice

//
// function addLightToExistingScenes(){
// 	//console.log(getSavedChapters()[0].scenes);
// 	let savedchapters = getSavedChapters();
// 	// console.log(savedchapters.length);
// 	for(let i=0;i<savedchapters.length;i++){
// 		// console.log(i + ' ' + savedchapters[i].scenes.length);
// 		for(let j=0;j<savedchapters[i].scenes.length;j++){
//
// 			savedchapters[i].scenes[j].lightSettings =  {
// 	      sceneNum: 0,
// 	      wrgb: [0,0,0,0],
// 	      cree: 0,
// 	      matrix: 0,
// 	      fadetime: 1000,
// 	      masterfade: 0,
// 	      fx: 0
// 	    }
// 		}
// 	}
// 	sceneManager.chapters = savedchapters;
// 	console.log(JSON.stringify(savedchapters));
// 	setTimeout(()=>{writeChapters();},800);
// }
//
// function addMoreScenes(howmany){
//   //dirty - we're just duplicating whatever the last chapter is - since it's now empty
//   let savedchapters = getSavedChapters();
//   let currentLength = savedchapters.length;
//   for(let i=0;i<howmany;i++){
//     savedchapters[currentLength+i] = savedchapters[currentLength-1];
//   }
//   sceneManager.chapters = savedchapters;
//   console.log(JSON.stringify(savedchapters));
//   setTimeout(()=>{writeChapters();},800);
// }


//setTimeout(()=>{addLightToExistingScenes();},800);
// setTimeout(()=>{addMoreScenes(8);},800);


//
// function randy(max) {
//   return Math.floor(Math.random() * max);
// }
//
// function rgbParty() {
// 	setTimeout(()=>{
// 		var myMessage = 's,1,' + randy(255) +',' + randy(255) + ',' + randy(255) + "," + randy(255) + ',1,'+ randy(4) +',1000,1,\n';
// 		port.write(myMessage, function(err) {
// 	  if (err) {
// 	    return console.log('Error on write: ', err.message)
// 	  }
// 	  console.log('message written: '+myMessage)
// 		lastMessage = myMessage;
// 		console.log('errs: '+errs);
// 		rgbParty();
// 	})},1200);
// }


//rgbParty();
