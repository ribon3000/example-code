const test = require('./scratchpad.js');


//test.chapters[0].scenes.sort((a, b) => parseFloat(a.end) - parseFloat(b.end));


//sortAscending(test.chapters[0].scenes,'end');

console.log(test);



  for(let i=181;i<8100;i+=100){
    console.log(test.lookupScene(test.chapters[0], i).debugName);
  }


//test.chapters[0].scenes.sort((a, b) => parseFloat(b.end) - parseFloat(a.end));



console.log(test.chapters[0].scenes);






test.insertScene(test.chapters[0],1500);
test.insertScene(test.chapters[0],7200);
test.insertScene(test.chapters[0],1200);
test.insertScene(test.chapters[0],5600);

console.log(test.chapters[0])



console.log('...')

console.log(test.lookupScene(test.chapters[0], 1100).debugName);

test.removeScene(test.chapters[0],1100);
test.removeScene(test.chapters[0],1400);
test.removeScene(test.chapters[0],7100);
test.removeScene(test.chapters[0],5500);


test.giveName(test.chapters[0],1620, "test");


console.log(test.chapters[0]);
console.log("...");

test.insertScene(test.chapters[1],2000);
test.insertScene(test.chapters[1],4000);
test.insertScene(test.chapters[1],6000);


console.log(test.chapters[1]);

test.removeScene(test.chapters[1], 7000);

console.log('...');

console.log(test.chapters[1]);
