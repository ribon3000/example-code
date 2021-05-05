//buzzer class??
//should have info about buzzer and switch input pins, led out pin and atem channel
//should maybe have state about whether we use this pin for lumakey or not???
//should definetly have a method that sets up a handler for the button presses and stuff
//should DEFINETLY have a unique identifier so we can talk to other buzzers (to turn their LEDS off)

var rpio = require('rpio');
const { Atem } = require('atem-connection');
const myAtem = new Atem();

module.exports = class Buzzer {

	constructor(id, buzzpin, togglepin, ledpin, atemchannel){
	this.ID = id
	this.buzzpin = buzzpin;
	this.togglepin = togglepin;
	this.ledpin = ledpin;
	this.atemchannel = atemchannel;
	}

	setuppins(){
	rpio.init({
		gpiomem: false,
		mapping: 'physical',
		mock: undefined,
		close_on_exit: true,
	});
	rpio.open(this.buzzpin, rpio.INPUT, rpio.PULL_UP);
	rpio.open(this.togglepin, rpio.INPUT, rpio.PULL_UP);
	rpio.open(this.ledpin, rpio.OUTPUT);
	console.log('pins setup');
	}

	listen(){
	console.log('trying to listen');
	rpio.poll(this.buzzpin, this.buzz(), rpio.POLL_LOW);
	//rpio.poll(this.togglepin, this.toggle(), rpio.POLL_LOW);
	console.log('listening');
	}

	buzz(){
	console.log('sleeping for 20 ms');
	rpio.msleep(20);
	if(rpio.read(this.buzzpin)){ return;};
	console.log('buzzing');
	/*setTimeout( () => {
		if (rpio.read(this.buzzpin)){ 
			return;
	 	} else { 
		this.pulseLED();
		this.switchChannel();
		}
	}, 20);*/
	this.pulseLED();
	this.switchChannel();
	console.log('buzzed');
	}
	/*
	toggle(){
	setTimeout(() => {
		if (rpio.read(this.buzzpin){return;}
	}, 120);
	return; //TODO: set this channel as luma input for next transition IF from this buzzer
	//so probably best to have the actual transitionlogic done in buzz() depending on some
	//state variable that we set here
	}
	*/

	pulseLED(){
	rpio.write(this.ledpin, rpio.HIGH);
	console.log('pulsed');
	//TODO: iterate through buzzer array and write LOW to all other buzzers
	}

	switchChannel(){
	console.log('switching');
	myAtem.changePreviewInput(this.atemchannel);
	myAtem.autoTransition();
	console.log('switched');
	}
}

