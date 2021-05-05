const path = require('path');
const fs = require('fs');

let saveFile = fs.readFileSync('chapters.json');



class Chapter {
  constructor(name, direction){
    this.name = name;
    this.direction = 'forward';
    this.scenes = [];
  }
}


function clamp(num, min, max){
	return Math.min(Math.max(num, min), max);
}


let chapters = JSON.parse(saveFile);


function changeChapter(index){
  return chapters[index];
}



class Scene {
  constructor(start, debugName, layers){
    this.start = start;
    this.debugName = debugName;
    this.displayName = debugName;
    if(layers){this.layers = layers} else {this.layers = []}
    this.lightSettings = {
      sceneNum: 0,
      wrgb: [0,0,0,0],
      cree: 0,
      matrix: 0,
      fadetime: 1000,
      masterfade: 0,
      fx: 0
    }
  }
}

function sortAscending(arr,prop){
  return arr.sort((a, b) => parseFloat(a[prop]) - parseFloat(b[prop]));
}


function sortDescending(arr,prop) {
  return arr.sort((a,b) => parseFloat(b[prop]) - parseFloat(a[prop]));
}


//this mutates in weird ways.
//its purpose is to 'close gaps' in names after adding and removing scenes
//hmm...
function renameScenes(chapter){
  for(let i=0;i<chapter.scenes.length;i++){
    chapter.scenes[i].debugName = ('scene' + (i+1));
    if(!chapter.scenes[i].displayName){
      chapter.scenes[i].displayName = ('scene' + (i+1));
    }
    //chapter.scenes[i].index = i;
  }
}

function removeScene(chapter,position){
  ///the following lines are problematic when deleting at an empty point - probably best to have a few checks in here & return when trying to delete empty
  //still doesn't work, same error "cannot read property debugName of undefined"
  //console.log(chapter.scenes);
  //console.log(lookupScene(chapter,pos));

  if(chapter.scenes.length == 1) {return;};

  let pos = clamp(position, 390, 8100);
  let startpos = lookupScene(chapter,pos).start;
  let idx = 0;
  if(startpos) idx = getIndex(chapter.scenes,'start',startpos);
  if (idx == 0){
    chapter.scenes.splice(idx,1);
    chapter.scenes[0].start = 390;
  } else{
    chapter.scenes.splice(idx,1);/*console.log('trying to delete nothing'); return;*/
  }
  //if (idx && idx < chapter.scenes.length) {chapter.scenes.splice(idx,1);}
    sortchapter(chapter);
  renameScenes(chapter);
  //console.log(chapter.scenes);
}

function sortchapter(chapter){
  if(chapter.direction == 'forward'){
    chapter.scenes = sortAscending(chapter.scenes,'start');
  } else if (chapter.direction == 'backward'){
    chapter.scenes = sortDescending(chapter.scenes,'start');
  }
}


function renameScene(chapter,position, newName){
  let pos = clamp(position, 390, 8100);
  let startpos = lookupScene(chapter,pos).start;
  let idx = false;
  if(startpos>= 0) idx = getIndex(chapter.scenes,'start',startpos);
  if (idx>= 0) {chapter.scenes[clamp(idx, 0, chapter.scenes.length)].displayName = newName; console.log("new name?")}
  else {console.error('trying to do funky stuff'); return;};
    sortchapter(chapter);
  //renameScenes(chapter);
}


function renameChapter(chapter,newName){
  chapter.name = newName;
}

function setEndAKAnextStart(chapter, position){
  if(chapter.scenes.length == 1) {return;};
  let pos = clamp(position, 390, 8100);

  //based off rename
  let startpos = lookupScene(chapter,pos).start;
  let idx = false;
  if(startpos>= 0) idx = getIndex(chapter.scenes,'start',startpos);
  if (idx>= 0 && idx < chapter.scenes.length-1) {chapter.scenes[idx+1].start = pos; console.log("new start for next one")}
  else {console.error('trying to do weird stuff'); return;};
    sortchapter(chapter);
  //renameScenes(chapter);
}

function setStartAKApreviousEnd(chapter, position){
  if(chapter.scenes.length == 1) { return;};
  let pos = clamp(position, 390, 8100);

  //based off rename
  let startpos = lookupScene(chapter,pos).start;
  let idx = false;
  if(startpos>= 0) idx = getIndex(chapter.scenes,'start',startpos);
  if (idx> 0) {chapter.scenes[idx].start = pos; console.log("new start for this one")}
  else {console.error('trying to do strange stuff'); return;};
    sortchapter(chapter);
  //renameScenes(chapter);
}

function lookupSceneOld(chapter, position){
    let a, b;
    for(let j=0;j<chapter.scenes.length;j++){
      if(chapter.direction == 'forward'){
         a = position;
         b = chapter.scenes[j].start;
      } else {
         b = position;
         a = chapter.scenes[j].start;
      };
      if (a<b){
        return(chapter.scenes[j]);
      }
    }
  }


function lookupScene(chapter, position){
    let pos = clamp(position, 390, 8100);
    //console.log(chapter.direction);
    if(chapter.direction == 'backward'){
      return lookupBackwards(chapter, pos);
    }
    let a, b, c, d;
      c = 0;
      d = chapter.scenes.length;
    for(c;c<d;c++){
         a = position;
         b = chapter.scenes[c].start;
      if (a<b){
        // console.log('lookupScene: '+c);
        return(chapter.scenes[clamp(c-1,0,chapter.scenes.length-1)]);
      }
    }
    return(chapter.scenes[chapter.scenes.length-1]);
  }

function lookupBackwards(chapter, position){
  let a, b, c, d;
  c = chapter.scenes.length-1;
  d = 0;
  //console.log("c is " + c);
  //console.log("d is " + d);
  for(c;c>0;c--){
    a = chapter.scenes[c].start;
    b = position;
    if(a>b){
      console.log(c);
      return(chapter.scenes[c]);
    }
  }
  return(chapter.scenes[0]);
}


function getIndex(arr, prop, val){
  return arr.findIndex(item => item[prop] === val);
}

function insertScene(chapter,position){
  chapter.scenes.push(new Scene(clamp(position-10, 390, 8100), ''));
  sortchapter(chapter);
  renameScenes(chapter);
}


module.exports = {

  chapters,
  changeChapter,
  renameChapter,
  Scene,
  insertScene,
  removeScene,
  lookupScene,
  renameScene,
  setStartAKApreviousEnd,
  setEndAKAnextStart,
  getIndex

}
