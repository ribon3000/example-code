// lets quickly test whether the pins for the buzzer boxes work

const rpio = require('rpio');


console.log('hello, im running\n');


let inputs = [3,5];


for(let i=0;i<inputs.length;i++){
	rpio.open(inputs[i], rpio.INPUT, rpio.PULL_UP);
	rpio.poll(inputs[i], testfunc, rpio.POLL_LOW);
}


function testfunc(){
	rpio.msleep(120);
	//if(rpio.read(pin)) return;
	console.log("buzz! ");
}


