//https://docs.google.com/spreadsheets/d/1dsuKNcoJC_322dw_NWS2AyzRKdMPEAl6IkInRrQG4dM/export?format=csv
//https://docs.google.com/spreadsheets/d/1dsuKNcoJC_322dw_NWS2AyzRKdMPEAl6IkInRrQG4dM/export?format=csv
// http://18.238.7.86:8000/
var Roboto = {};
function setup() {
  createCanvas(1600, 800); // Common projector size
  frameRate(60);
  Roboto = {
    Light: loadFont("fonts/RobotoCondensed-Light.ttf"),
    Regular: loadFont("fonts/RobotoCondensed-Regular.ttf"),
    // Bold: loadFont("fonts/RobotoCondensed-Bold.ttf"),
    // LightItalic: loadFont("fonts/RobotoCondensed-LightItalic.ttf"),
    // RegularItalic: loadFont("fonts/RobotoCondensed-Italic.ttf"),
    // BoldItalic: loadFont("fonts/RobotoCondensed-BoldItalic.ttf"),
  }
  window.data = loadTable("data.csv"); // Load data from local server
  // New data must be redownloaded by the server first... avoids cross origin request
}
function getPeopleArray(){
  return data.rows.slice(1).map((row) => row.arr); // First row is header data, discard that
}
function getPersonHourly(person){
  return person.slice(4, 28);
}
function positiveMod(n, d){
  return ((n % d) + d) % d;
}

function findOnsetCircular(array, test){
  for(var i = 0; i < array.length; i++){
    if(test(array[i]) && !test(array[positiveMod(i-1, array.length)])){
      return i;
    }
  }
  return -1;
}

function findOnsets(array, test){
  var priorState = false, result = [];
  for(var i = 0; i < array.length; i++){
    var newState = test(array[i]);
    if(priorState != newState){
      priorState = newState;
      result.push(i);
    }
  }
  if(priorState){
    result.push(i);
  }
  return result;
}
// For example:
// positiveMod(-1, 24) => 23
// positiveMod(-25, 24) => 23

function histogram(array){
  return array.reduce(
    function(history, item){
      history[item] = (history[item] || 0) + 1;
      return history;
    }
  ,{});
}

class Person {
  constructor(row){
    this.busy = parseInt(row[1]);
    this.happy = parseInt(row[2]);
    this.dinner = row[3];
    this.hours = getPersonHourly(row);

    this._x = width/2;
    this._y = height/2;
    this.x = width/2; // Where Person wants to go
    this.y = height/2; // Where Person wants to go
    this._color = [0, 0, 0, 0];
    this.color = [0, 0, 0, 0];
    this.size = 20;

    this.rand = Math.random();
  }
  draw(){
    if(time > cycleTransition){
      this._x = this.x;
      this._y = this.y;
      this._color = this.color;
    }
    else{
      var factor = TWEEN.Easing.Circular.In(constrain(time/cycleTransition, 0, 1));
      this._x = lerp(this._x, this.x, factor);
      this._y = lerp(this._y, this.y, factor);
      this._color = lerpArray(this._color, this.color, factor);
    }
    noStroke();
    fill.apply(null, this._color);
    ellipse(this._x, this._y, this.size, this.size);
  }
}

var people = null;
var isDataLoaded = false;
var time = 0;

function dataLoaded(){
  people = getPeopleArray().map((row)=>new Person(row));
}

var lastRender = Date.now();
var lastTime = 0;
var lastMouseX = 0;

function draw() {
  if(!isDataLoaded){
    if (data.rows.length > 0){
      isDataLoaded = true;
      dataLoaded();
    }
    else {
      return;
    }
  }

  background(0);

  // time = 40.5;
  var delta = Date.now() - lastRender;
  if(mouseIsPressed){
    time = max(0, lerp(time, lastTime+=48*(mouseX - lastMouseX)/width, 0.5));
    cycles[cycleIndex](1, time);
  }
  else{
    cycles[cycleIndex](constrain((cycleTimes[cycleIndex]-time)/cycleFade, 0, 1), time);
    time += delta / 1000;
    if(time > cycleTimes[cycleIndex]){
      cycleIndex = positiveMod(cycleIndex + 1, cycles.length);
      time = 0;
    }
    lastTime = time;
  }
  lastMouseX = mouseX;
  lastRender += delta;
  updatePeople();
}

function updatePeople(){
  people.forEach((person)=>{
    person.draw();
  });
}
var cycleIndex = 0;
var cycles = [
  // FlowyView,
  NumberView,
  BusyVTime,
  // FlowyView,
  CirclesView,
  HistogramView,
];
var cycleFade = 2;
var cycleTransition = 1.5;
var cycleTimes = [
  // 60,
  10,
  20,
  // 10,
  48,
  45,
];

var colorScheme = [
  [200, 60, 53, 255], //0
  [80, 75, 71, 255], //1
  [200, 160, 0, 255], //2
  [83, 235, 201, 255], //3
  [255, 63, 62, 255], //4
  [148, 170, 176, 255], //5
  [254, 254, 93, 255], //6
  [39, 213, 120, 255], //7
  [255, 244, 214, 255], //8
  [253, 84, 65, 255], //9
  [255, 227, 0, 255], //10
  [255, 255, 255, 255], //11
  [254, 112, 98, 255], //12
  [255, 63, 62, 255], //13
  [46, 38, 52, 255], //14
  [255, 227, 0, 255], //15
  [139, 0, 139, 255], //16
]
var colors = {
  white: [255, 255, 255, 255],
  "In class": colorScheme[3],
  "Psetting, studying, class projects": colorScheme[4],
  "Paid work, UROP": colorScheme[5],
  "Personal projects, student groups": colorScheme[6],
  "Socializing, relaxing": colorScheme[7],
  "Sleep": colorScheme[15],
  "Personal care (eating, chores etc)": colorScheme[12],
  "Exercise": colorScheme[9],
  "Other": colorScheme[1],
  "yes": colorScheme[7],
  "maybe": colorScheme[2],
  "no": colorScheme[0],
}

var ordering = [
  "Exercise",
  "Paid work, UROP",
  "Personal projects, student groups",
  "Personal care (eating, chores etc)",
  "Psetting, studying, class projects",
  "In class",
  "Socializing, relaxing",
  "Sleep",
  "Other",
]
var brief = {
  "Other": "Other",
  "Exercise": "Exercise",
  "Psetting, studying, class projects": "Studying",
  "Personal care (eating, chores etc)": "Personal",
  "Personal projects, student groups": "Projects",
  "Paid work, UROP": "Work",
  "Socializing, relaxing": "Social",
  "In class": "Class",
  "Sleep": "Sleep",
}
function NumberView(opacity, time) { // Shows how many people there are
  // Draw background
  var peepsPerRow = 10;

  // Update people
  people.forEach((person, index)=>{
    var expectedX = (index % peepsPerRow - peepsPerRow/2) * 100 + width / 2;
    var expectedY = 50+(Math.floor(index / peepsPerRow) - people.length/peepsPerRow/2) * 100 + height / 2;
    if(time == 0){
      // person.x = expectedX;
      // person.y = expectedY;
      person.color = colors[ordering[Math.floor(person.rand*ordering.length)]];
    }
    person.x = expectedX;//lerp(person.x + (2 * Math.random() - 1) * 1, expectedX, 0.1);
    person.y = expectedY;//lerp(person.y + (2 * Math.random() - 1) * 1, expectedY, 0.1);
  });
  textFont(Roboto.Light);
  textSize(45);
  textAlign(LEFT);
  fill(setOpacity(colorScheme[3], opacity*constrain(time - 1, 0, 1)));
  text(people.length, width/2-250, 140);
  fill(255, 255, 255, 255*opacity*constrain(time - 1, 0, 1));
  text(" survey participants".toUpperCase(), width/2-250 + textWidth(people.length+""), 140);
}
function drawAxis(x, y, x2, y2, ticks, opacity, time, dotsOnly){
  var size = 10;
  var thickness = 2;
  var dotthickness = 2;

  if(!dotsOnly){
    // -
    fill(255, 255, 255, 255*opacity*constrain(time*2, 0, 1));
    rect(x - thickness - size,y - thickness,thickness*2 + size*2, thickness*2);
    // +
    fill(255, 255, 255, 255*opacity*constrain((time-0.1*(ticks-1))*2, 0, 1));
    rect(x2 - thickness - size,y2 - thickness,thickness*2 + size*2, thickness*2);
    rect(x2 - thickness,y2 - thickness - size,thickness*2, thickness*2 + size*2);
  }

  // .
  for(var i = 0; i < ticks; i++){
    fill(255, 255, 255, 255*opacity*constrain((time-0.1*i)*2, 0, 1));
    rect(
      lerp(x, x2, i/(ticks-1))-dotthickness,
      lerp(y, y2, i/(ticks-1))-dotthickness, dotthickness*2, dotthickness*2);
  }
  // var xl = lerp(x, x2, 1/(ticks-1));
  // var x2l = lerp(x, x2, (ticks-2)/(ticks-1));
  // var yl = lerp(y, y2, 1/(ticks-1));
  // var y2l = lerp(y, y2, (ticks-2)/(ticks-1));
  // rect(xl - thickness, yl - thickness, x2l - xl + thickness*2, y2l - yl + thickness*2);
}
function BusyVTime(opacity, time) { // Shows how many people there are
  // Draw background
  var fromLeft = 200;
  textFont(Roboto.Light);
  textSize(45);
  // resetMatrix();
  textAlign(LEFT);
  var spacing = 45;
  resetMatrix();
  translate(2* width/3+50, height/2+100)
  fill(setOpacity(colors.white, opacity*constrain(time - 0.5, 0, 1)));
  text("Do you have time\nto get dinner with\na friend tonight?".toUpperCase(),0 , - 200);
  fill(setOpacity(colors.yes, opacity*constrain(time-1.5, 0, 1)));
  text("YES".toUpperCase(),0  + 270, 0);
  fill(setOpacity(colors.maybe, opacity*constrain(time-1.5, 0, 1)));
  text("MAYBE".toUpperCase(),0  + 100, 0);
  fill(setOpacity(colors.no, opacity*constrain(time - 1.5, 0, 1)));
  text("NO".toUpperCase(),0 , 0);
  resetMatrix();

  textSize(25);
  fill(setOpacity(colors.white, 1*opacity*constrain(time-2.5, 0, 1)));
  textFont(Roboto.Regular);
  text("HOW BUSY ARE YOU?".toUpperCase(), width/2-100*3-5, height - 15);
  translate(135, height/2);
  fill(setOpacity(colors.white, 1*opacity*constrain(time-3.5, 0, 1)));
  rotate(-Math.PI/2);
  text("HOW HAPPY ARE YOU?".toUpperCase(), -110, 0);
  resetMatrix();
  // console.log()
  // resetMatrix();

  drawAxis(-3 * 200 + width / 2, height-50, 1 * 200 + width / 2, height-50, 9, opacity, time-1.5);
  drawAxis(150, 3 * 100 + height / 2, 150, -3 * 100 + height / 2, 7, opacity, time-2.5);
  // Update people
  people.forEach((person, index)=>{
    var expectedX = (person.busy - 6) * 200 + width / 2 + (2 * person.rand - 1) * 20;
    var expectedY = (person.happy - 4) * 100 + height / 2 + (Math.sin(person.rand*100)) * 20;
    if(time == 0){
      if (person.dinner == "Yes") {  //color the dots by whether that person can get dinner with a friend.
          person.color = colors.yes;
      } else if (person.dinner == "Maybe"){
          person.color = colors.maybe; //purple ones answered 'maybe' or 'no'
      } else{
        person.color = colors.no;
      }
    }
    person.x = expectedX;
    person.y = expectedY;
    // person.x = lerp(person.x + (2 * Math.random() - 1) * 1, expectedX, 0.1);
    // person.y = lerp(person.y + (2 * Math.random() - 1) * 1, expectedY, 0.1);
  });
}
//MergeSort, not my code

function mergeSort(arr, comparator)
{
    if (arr.length < 2)
        return arr;

    var middle = parseInt(arr.length / 2);
    var left   = arr.slice(0, middle);
    var right  = arr.slice(middle, arr.length);

    return merge(mergeSort(left, comparator), mergeSort(right, comparator), comparator);
}

function merge(left, right, comparator)
{
    var result = [];

    while (left.length && right.length) {
        if (comparator(left[0], right[0]) <= 0) {
            result.push(left.shift());
        } else {
            result.push(right.shift());
        }
    }

    while (left.length)
        result.push(left.shift());

    while (right.length)
        result.push(right.shift());

    return result;
}
// Check Facebook messenger

var flows = [];
var flowPositioning = [];
function ComputeFlows(){
  flows = [];
  for(var i = 0; i < 48; i++){
    flows.push([]);
  }
  people.forEach((person, index)=>{
    // Iterate through hours
    person.hours.forEach((activity, hour)=>{
      // var nextHour = positiveMod(hour + 1, 24);
      // console.log(person);
      flows[hour].push(person);
      flows[hour + 24].push(person);
    });
  });
  // Stable sort the flows by activity to form activity clusters
  for(var hour = 0; hour < flows.length; hour++){
    var column = flows[hour];
    var nextHour = hour >= 24 ? positiveMod(hour - 1, 24) : positiveMod(hour + 1, 24);
    flows[hour] = mergeSort(column, (a,b)=>
      ordering.indexOf(a.hours[hour % 24]) - ordering.indexOf(b.hours[hour % 24]) ||
      ordering.indexOf(a.hours[nextHour]) - ordering.indexOf(b.hours[nextHour])
    );
  };
  for(var i = 0; i < 24; i++){
    var map = {};
    flowPositioning.push(map);
    ordering.forEach((category)=>{
      var onsets = findOnsets(flows[i],(person)=>person.hours[i]===category);
      map[category] = onsets;
    })
  }
}

function setOpacity(array, opacity){
  var result = array.slice(0);
  result[3] = opacity * result[3];
  return result;
}

function FlowyView(opacity, time) { // Shows how many people there are
  // Draw background

  // Update people
  //Hello! I'm online now - Willy

  if(time == 0){
    ComputeFlows();
  }
  var margin = 20;
  var hourWidth = 30;
  var hourSpacing = (width+hourWidth-margin*2) / 25;
  var vertSpacing = (height - 100 - margin*2) / people.length;
  var bezierFactor = 0.2;
  var pnpDelta = null;
  resetMatrix();
  translate(margin, margin);
  flows.forEach((column, hour)=>{
    if(hour > 23) return;
    // Iterate through hours
    fill(255,255,255,opacity*50*TWEEN.Easing.Circular.Out(constrain(time - hour/20, 0, 1)));
    column.forEach((person, position)=>{
      var nextPosition = flows[positiveMod(hour + 1, 24) + 24].indexOf(person);

      if(position == 0){
        noStroke();
        beginShape();
        vertex(hourSpacing*hour + hourWidth, vertSpacing*position);
        bezierVertex(hourSpacing*(hour + bezierFactor) + hourWidth, vertSpacing*position,
          hourSpacing*(hour + 1 - bezierFactor), vertSpacing*nextPosition,
          hourSpacing*(hour + 1), vertSpacing*nextPosition);
        pnpDelta = nextPosition - position;
      }
      if(pnpDelta !== nextPosition - position){
        vertex(hourSpacing*(hour+1), vertSpacing*(position + pnpDelta));
        bezierVertex(
          hourSpacing*(hour + 1 - bezierFactor), vertSpacing*(position + pnpDelta),
          hourSpacing*(hour + bezierFactor) + hourWidth, vertSpacing*(position),
          hourSpacing*hour + hourWidth, vertSpacing*(position));
        endShape();
        noStroke();
        beginShape();
        vertex(hourSpacing*hour + hourWidth, vertSpacing*position);
        bezierVertex(hourSpacing*(hour + bezierFactor) + hourWidth, vertSpacing*position,
          hourSpacing*(hour + 1 - bezierFactor), vertSpacing*nextPosition,
          hourSpacing*(hour + 1), vertSpacing*nextPosition);
        pnpDelta = nextPosition - position;
      }
      if(position == column.length - 1){
        vertex(hourSpacing*(hour+1), vertSpacing*(nextPosition+1));
        bezierVertex(
          hourSpacing*(hour + 1 - bezierFactor), vertSpacing*(nextPosition+1),
          hourSpacing*(hour + bezierFactor) + hourWidth, vertSpacing*(position+1),
          hourSpacing*hour + hourWidth, vertSpacing*(position+1));
        endShape();
      }
    });
    ordering.forEach((category)=>{
      fill.apply(null, setOpacity(colors[category], opacity));
      var from = flowPositioning[hour][category][0];
      var to = flowPositioning[hour][category][1];
      rect(hourSpacing*hour, vertSpacing*from, TWEEN.Easing.Back.Out(constrain(time - hour/20, 0, 1)) * hourWidth, vertSpacing * (to-from));
      if(hour == 0){
        rect(hourSpacing*24, vertSpacing*from, TWEEN.Easing.Back.Out(constrain(time - (hour + 24)/20, 0, 1)) * hourWidth, vertSpacing * (to-from));
      }
    });
    fill(255, opacity * 255 * TWEEN.Easing.Circular.Out(constrain(time - 0.5 - hour/20, 0, 1)));
    textFont(Roboto.Regular);
    textSize(25);
    textAlign(CENTER);
    text(hour, hourSpacing*hour + hourWidth/2, height-110);
    if(hour == 0){
      fill(255, opacity * 150 * TWEEN.Easing.Circular.Out(constrain(time - 0.5 - (hour+24)/20, 0, 1)));
      text(0, hourSpacing*24 + hourWidth/2, height-110);
    }
  });
  resetMatrix();
  // Labels
  var fromLeft = 25;
  ordering.forEach((category, index)=>{
    textFont(Roboto.Light);
    textSize(45);
    // resetMatrix();
    textAlign(LEFT);
    fill(setOpacity(colors[category], opacity*TWEEN.Easing.Circular.Out(constrain(time*0.5 - index/20 - 0.8, 0, 1))));
    var toDisplay = brief[category].toUpperCase();
    // console.log(toDisplay)
    // var unitWidth = width/ordering.length;
    // translate((index+0.5) * unitWidth, height - 33);
    // rotate(-0.2);
    text(toDisplay, fromLeft, height - 30);
    fromLeft += textWidth(toDisplay) + 28;
    // console.log()
    // resetMatrix();
  });
  // Moving people
  people.forEach((person, index)=>{
    // var indexPath = //person.hours.map((c,i)=>(flowPositioning[i][c][0] + flowPositioning[i][c][1])/2);
    var indexedTime = positiveMod(/*time*.05+*/index, 24);
    var leftIndex = Math.floor(indexedTime);
    var rightIndex = positiveMod(leftIndex + 1, 24);
    var ly = flows[leftIndex].indexOf(person) + 0.5;
    var ry = flows[rightIndex+24].indexOf(person) + 0.5;
    person.x = margin+ hourWidth/2 + hourSpacing * indexedTime;
    person.y = margin+ vertSpacing * bezierPoint(ly, ly, ry, ry, indexedTime - leftIndex);
    person.color = lerpArray(colors[person.hours[leftIndex]], colors[person.hours[rightIndex]], indexedTime - leftIndex);
  });

}

var lerpArray = function(a1, a2, factor){
  return a1.map((item, i)=> lerp(item, a2[i], factor));
}
var getActivityLocationX = function(activity){
  var index = ordering.indexOf(activity);
  return width/5 * (0.5 + index % 5) + (index > 4? width/5/2 : 0);
}
var getActivityLocationY = function(activity){
  var index = ordering.indexOf(activity);
  return (index > 4? 2.8*height/4: 1.2*height/4)+0;
}
var radii = {};
function computeRadii(){
  radii = {};
  for(var i = 0; i < 24; i++){
    people.forEach((person, index)=>{
      // Iterate through hours
      person.hours.forEach((activity, hour)=>{
        radii[activity] = radii[activity] || {};
        radii[activity][hour] = radii[activity][hour] || 0;
        radii[activity][hour]++;
      });
    });
  }
}
function getRadius(activity, hour){
  return Math.sqrt(radii[activity][hour] || 0)*15;
}
function CirclesView(opacity, time) { // Shows how many people there are
  // var circleRadius = 280;
  if(time == 0){
    computeRadii();
  }
  resetMatrix();
  // Labels
  var clock = positiveMod(time, 24);
  var leftIndex = Math.floor(clock);
  var rightIndex = positiveMod(leftIndex + 1, 24);
  var factor = TWEEN.Easing.Cubic.InOut(clock - leftIndex);

  ordering.forEach((category, index)=>{
    textFont(Roboto.Light);
    textSize(45);
    // resetMatrix();
    textAlign(LEFT);
    fill(setOpacity(colors[category], opacity*TWEEN.Easing.Circular.Out(constrain(time*0.5 - index/20, 0, 1))));
    var toDisplay = brief[category].toUpperCase();
    text(toDisplay, getActivityLocationX(category) - textWidth(toDisplay)/2, getActivityLocationY(category) + 18);
    stroke(setOpacity(colors[category], opacity*TWEEN.Easing.Circular.Out(constrain(time*0.5 - index/20, 0, 1))));
    noFill();
    strokeWeight(2);
    var circleRadius = lerp(getRadius(category, leftIndex), getRadius(category, rightIndex), factor);
    if(circleRadius > 1){
      ellipse(getActivityLocationX(category), getActivityLocationY(category), circleRadius, circleRadius);
    }
    noStroke();

    // fromLeft += textWidth(toDisplay) + 28;
    // console.log()
    // resetMatrix();
  });

  var spacing = 30;
  textFont(Roboto.Light);
  textSize(60);
  textAlign(LEFT);
  // fill(255);
  fill(setOpacity(colors.white, opacity*constrain(time - 1, 0, 1)));
  text(Math.floor(leftIndex/10), width/2-2*spacing, 140);
  text(leftIndex % 10, width/2-spacing, 140);
  text(".", width/2, 140 - 8);
  text(".", width/2, 140 - 20);
  text(Math.floor((clock - leftIndex) * 6), width/2+spacing - 11, 140);
  text(Math.floor((clock - leftIndex) * 60) % 10, width/2+2*spacing - 11, 140);

  drawAxis(50, 70, width - 50, 70, 25, opacity, time - 0.7, true);
  noFill();
  strokeWeight(3);
  stroke(setOpacity(colors.white, opacity*constrain(time - 1, 0, 1)));

  //  = -n
  var sunHeight = - Math.cos(clock/24 * Math.PI * 2) + Math.cos(6.9/24 * Math.PI*2);
  if(abs(sunHeight*50) > 15/2){
    line(50 + clock/24 * (width - 100), 70 - sunHeight * 50 + (sunHeight>0?15:-15)/2,
         50 + clock/24 * (width - 100), 70);
  }
  // fill(0);
  ellipse(50 + clock/24 * (width - 100), 70 - sunHeight * 50, 15, 15);
  noStroke();
  // Moving people

  people.forEach((person, index)=>{
    var lcategory = person.hours[leftIndex];
    var rcategory = person.hours[rightIndex];
    var lx = getActivityLocationX(lcategory);
    var ly = getActivityLocationY(lcategory);
    var rx = getActivityLocationX(rcategory);
    var ry = getActivityLocationY(rcategory);
    var circleRadius = lerp(getRadius(lcategory, leftIndex), getRadius(rcategory, rightIndex), factor) - 20;
    person.x = lerp(lx, rx, factor) + Math.cos(person.rand * 100) * person.rand * circleRadius / 2;
    person.y = lerp(ly, ry, factor) + Math.sin(person.rand * 100) * person.rand * circleRadius / 2;
    person.color = lerpArray(colors[person.hours[leftIndex]], colors[person.hours[rightIndex]], factor);
  });

}
var hist = {};
function buildHistogram(){
  hist = {};
  ordering.forEach((activity)=>{
    people.forEach((person, index)=>{
      // Iterate through hours
      var count = person.hours.filter((act)=> act === activity).length;
      hist[activity] = hist[activity] || {};
      hist[activity][count] = hist[activity][count] || [];
      hist[activity][count].push(person);
    });
  });
}
var ticks = 0;
function HistogramView(opacity, time) { // Shows how many people there are
  // var circleRadius = 280;
  if(time == 0){
    buildHistogram();
  }
  resetMatrix();
  // Labels
  var clock = positiveMod(time / 5, ordering.length);
  var leftIndex = Math.floor(clock);
  var previousIndex = positiveMod(leftIndex - 1, ordering.length);
  var factor = TWEEN.Easing.Exponential.InOut(clock - leftIndex);

  resetMatrix();
  // Labels
  var fromLeft = 25;
  ordering.forEach((category, index)=>{
    textFont(Roboto.Light);
    textSize(45);
    // resetMatrix();
    textAlign(LEFT);
    var currentopacity = lerp(+(previousIndex == index), +(leftIndex == index), min(1, 5*(clock-leftIndex)));
    fill(setOpacity(colors[category], lerp(currentopacity, 1, 0.2) * opacity *
          TWEEN.Easing.Circular.Out(constrain(time*0.5 - index/20 - 0.5, 0, 1))));
    var toDisplay = brief[category].toUpperCase();
    // console.log(toDisplay)
    // var unitWidth = width/ordering.length;
    // translate((index+0.5) * unitWidth, height - 33);
    // rotate(-0.2);
    text(toDisplay, fromLeft, 80);
    fromLeft += textWidth(toDisplay) + 28;
    // console.log()
    // resetMatrix();
  });
  textSize(25);
  textAlign(LEFT);
  textFont(Roboto.Regular);
  fill(255, 255, 255, 255*opacity*constrain(time - 0.5, 0, 1));
  text("Hours per day".toUpperCase(), width/2 -77, height - 40);
  var currentHist = hist[ordering[leftIndex]];
  var currentHours = Object.keys(currentHist);
  var maxHours = parseInt(currentHours[currentHours.length - 1]);
  var margin = 100;
  var vspacing = 50;
  var lerpSpeed = 0.5 * TWEEN.Easing.Circular.In(min(1, 3*(clock - leftIndex)));
  currentHours.forEach((hour)=>{
    // Bidirectional animation is too much? More effective to set people's
    // locations by stepping through the history.
    var numPeople = currentHist[hour].length;
    currentHist[hour].forEach((person, index)=>{
      var targetX = margin + hour/maxHours * (width - margin * 2);// + (2 * person.rand - 1) * (3);
      var targetY = height - 120 - min((height - 250)/numPeople, vspacing) * (index);
      var targetColor = colors[ordering[leftIndex]];
      if(time == 0){
        person.x = targetX;
        person.y = targetY;
        person.color = targetColor;
      }
      else{
        person.x = lerp(person.x, targetX, lerpSpeed);
        person.y = lerp(person.y, targetY, lerpSpeed);
        person.color = lerpArray(person.color, targetColor, lerpSpeed);
      }
    });
  });
  if(time == 0){
    ticks = maxHours + 1;
  }
  ticks = lerp(ticks, maxHours + 1, lerpSpeed);
  drawAxis(margin, height-100, width - margin, height-100, ticks, opacity, time, true);
  for(var i = 0; i < ticks; i++){
    fill(255, 255, 255, 255*opacity*constrain((time-0.1*i)*2, 0, 1));
    textFont(Roboto.Regular);
    textSize(25);
    textAlign(CENTER);
    var x = margin, y = height-70;
    var x2 = width - margin, y2 = height-70;
    text(i, lerp(x, x2, i/(ticks-1)),
      lerp(y, y2, i/(ticks-1)));
  }

  // noFill();
  // strokeWeight(1.5);
  // stroke(setOpacity(colors.white, opacity*constrain(time - 1, 0, 1)));

  //  = -n
  // Moving people



}
