//runs super fast once the node server is up


//migrating from applest-atem to atem-connection

//var ATEM = require('applest-atem'); //deprecated
const { Atem } = require('atem-connection'); //new library
const myAtem = new Atem();
var rpio = require('rpio');
const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const randomInt = () => Math.floor((Math.random() * 4) + 1);



//unused because RPIO needs global scope
//const buzzer = require('./buzzer.js');


//a few globals we need for stateLogging checks, debugging etc
var lastDSKState = false;
let buzzers = [];
let dskonair = false;
let dsksource = false;
let activechannel = 1; //probably should initialize this
let stateLogging = true


//initialize GPIO pins
rpio.init({
	gpiomem: false,
	mapping: 'physical',
	mock: undefined,
	close_on_exit: true,
});



//open and start reading from buzzer pins
rpio.open(3, rpio.INPUT, rpio.PULL_UP);
rpio.open(5, rpio.INPUT, rpio.PULL_UP);
rpio.open(7, rpio.INPUT, rpio.PULL_UP);
rpio.open(13, rpio.INPUT, rpio.PULL_UP);
rpio.poll(3, pollcb, rpio.POLL_LOW);
rpio.poll(5, pollcb, rpio.POLL_LOW);
rpio.poll(7, pollcb, rpio.POLL_LOW);
rpio.poll(13, pollcb, rpio.POLL_LOW);



//same for downstream key switch pins
rpio.open(10, rpio.INPUT, rpio.PULL_UP);
rpio.open(11, rpio.INPUT, rpio.PULL_UP);
rpio.open(16, rpio.INPUT, rpio.PULL_UP);
rpio.open(15, rpio.INPUT, rpio.PULL_UP);
rpio.poll(10, pollswitch, rpio.POLL_BOTH);
rpio.poll(11, pollswitch, rpio.POLL_BOTH);
rpio.poll(16, pollswitch, rpio.POLL_BOTH);
rpio.poll(15, pollswitch, rpio.POLL_BOTH);



//finally init pinout to MOSFET-controller Arduino - all channels low for starters
rpio.open(12, rpio.OUTPUT);
rpio.write(12, rpio.LOW);
rpio.open(32, rpio.OUTPUT);
rpio.write(32, rpio.LOW);
rpio.open(33, rpio.OUTPUT);
rpio.write(33, rpio.LOW);
rpio.open(35, rpio.OUTPUT);
rpio.write(35, rpio.LOW);


//register ATEM callbacks

myAtem.on('info', console.log);
myAtem.on('error', console.error);

//establish ATEM connection

myAtem.connect('192.168.10.240');

//do init sequence once connection is up, switching from default channel to 3 gives technicians visual feedback when the entire system is ready to go

myAtem.on('connected', () => {
	myAtem.setMixTransitionSettings({rate: 3});
	myAtem.setDownstreamKeyFillSource(1,0);
	myAtem.setDownstreamKeyCutSource(1,0);
	myAtem.setDownstreamKeyGeneralProperties({
			rate: 25,
			preMultiply: false,
			clip: 500,
			gain: 500,
			invert: false
			});
	myAtem.setDownstreamKeyOnAir(false);
	myAtem.changeProgramInput(3).then(() => {
		console.log('Program input set');
	});
	console.log(myAtem.state);
	//setTimeOut(()=> {dskonair=true;console.log('setting up dsk');},1000);
})

/*
myAtem.on('stateChanged', (state, pathToChange) => {
	console.log("STATE \n");
	console.log(state);
	console.log("VIDEO \n");
	console.log(state.video);
	console.log("MIXEFFECTS \n");
	console.log(state.video.mixEffects);
//	console.log("UPSTREAMKEYERS \n");
//	console.log(state.video.mixEffects.upstreamKeyers[0]); //having problems accessing upstreamkeystate
								//why do these libraries insist on using the weirdest json syntax ever
	console.log("DOWNSTREAMKEYERS \N");
	console.log(state.video.downstreamKeyers);
});
*/



//recurse();


//log state whenever something changes unless we don't want to
myAtem.on('stateChanged', (state, pathToChange) => {
	if (stateLogging) {
	//console.log(state.video.mixEffects[0]); //catch the atem state.
	console.log(state.video.downstreamKeyers[0]);
	stateLogging = false; //lets not flood the screen please.
	lastDSKState = state.video.downstreamKeyers[0].onAir;
	console.log(lastDSKState);
	}
});



//used for command line input - simple recursive REPL thing, not used anymore
function recurse() {

	rl.question("what ?", function(num){
	if(num){
	transition(num);
	}
	recurse();
	});

}
//do stuff depending on number we entered or button we pressed
function transition(num) {
	if(num > 0 && num < 5){
		//myAtem.changeProgramInput(num);
		myAtem.changePreviewInput(num);
		//myAtem.cut();
		myAtem.autoTransition();
		//myAtem.cutTransition();
		//	atem.changeProgramInput(3,1); //these numbers are probably wrong <-- definetly wrong
		pulseLED(num-1); //zero index so we subtract 1
		stateLogging = true; //for debugging purposes - reenables state printing to console
		activechannel = num; // store our active channel in global variable - to double check with state later on
	} else if (num == 8) {
	//dskonair = !dskonair;
	//myAtem.setDownstreamKeyOnAir(dskonair);
	return;
	} else console.log('bad number, broski');
}



function pollcb(pin)
{
	/*console.log('button registered');
	setTimeout(() => {
	if (!rpio.read(pin)){
		console.log('Button pressed on pin P%d', pin);
		if(pin == 3) transition(1);
		if(pin == 5) transition(2);
		if(pin == 7) transition(3);
		if(pin == 13) transition(4);
	}}, 100);*/
	rpio.msleep(30);
	if (rpio.read(pin))
		return;
	console.log('Button pressed on P%d', pin);
	if(pin == 3) transition(1);
	if(pin == 5) transition(2);
	if(pin == 7) transition(3);
	if(pin == 13) transition(4);

}


function pollswitch(pin)
{
	rpio.msleep(240);
	if (rpio.read(pin)){
		console.log('switch ' + pin + ' toggled off');
		console.log(lastDSKState);
		if(lastDSKState===true){
			console.log('should try setting it off');
			myAtem.setDownstreamKeyOnAir(false).then(()=>{
			console.log('should have set it off');
			lastDSKState = false;
			return;
			});
			};
		console.log('was already off');
		return;
	}
	console.log('switch ' + pin + ' toggled on');
	setOverlay(pin);
	/*if(pin == 5) transition(2);
	if(pin == 7) transition(3);
	if(pin == 13) transition(4);
	*/
	return;
}

function setOverlay(pin){
	let source;
	if(pin === 10) source = 1;
	if(pin === 11) source = 2;
	if(pin === 16) source = 3;
	if(pin === 15) source = 4;
	if(!source) source = 1;
	console.log('setting overlay to ' + pin);
	myAtem.setDownstreamKeyFillSource(source,0).then(()=>{
	myAtem.setDownstreamKeyCutSource(source,0).then(()=>{
	myAtem.setDownstreamKeyOnAir(true).then(()=>{
	lastDSKState = true;
	});});});
};




function pulseLED(index){
	console.log("pulsing " + index);
	var pinmap = [12,32,33,35];

	if(pinmap[index]){		//zero index fuckery
		pin = pinmap[index];
	} else { return;}

	//rpio.open(pin, rpio.OUTPUT);
	rpio.write(pin, rpio.HIGH);

	for(let i = 0; i<4; i++){
		if(pinmap[i] != pin){
		rpio.write(pinmap[i], rpio.LOW);
		}
	}
}
