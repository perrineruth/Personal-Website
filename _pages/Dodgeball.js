// canvas details
var theCanvas=document.getElementById("myCanvas");
var canvasContext=theCanvas.getContext("2d");
// parameters and temp params
var N = 25;
var N_new = N;
var a1 = .5;
var a2 = .5;
// player array
var Team1;
var Team2;
var Sim = 0;



////////// start, pause, and reset control//////////
var start_btn = document.getElementById("start");
start_btn.addEventListener("click", Start);
var pause_btn = document.getElementById("pause");   // Create a <button> element
pause_btn.addEventListener("click", pause)
var reset_btn = document.getElementById("reset");   // Create a <button> element
reset_btn.addEventListener("click", Reset)



////////// parameter sliders //////////
var N_range = document.getElementById("NRange");
var N_Label = document.getElementById("NLabel");
N_range.oninput = updateN;
var a1_range = document.getElementById("a1Range");
var a1_Label = document.getElementById("a1Label");
a1_range.oninput = updatea1;
var a2_range = document.getElementById("a2Range");
var a2_Label = document.getElementById("a2Label");
a2_range.oninput = updatea2;



////////// functions to update parameters //////////
function updateN() {
	N_new = this.value;
	N_Label.innerHTML = "N = " + N_new + " (Number of Players)";
}

function updatea1() {
	a1_new = this.value;
	a1_Label.innerHTML = "a1 = " + a1_new + " (Strategy of Blue Team)";
}

function updatea2() {
	a2_new = this.value;
	a2_Label.innerHTML = "a2 = " + a2_new + " (Strategy of Red Team)";
}



// Player/player Constructor
function Player(x,y,r) {
    this.x = x;
    this.y = y;
    this.r = r;
    // I've added the drawing code to the actual circle
    // they can draw themselves.
    this.draw = function(context, color){
        context.beginPath();
        context.arc(this.x, this.y, this.r, 0, Math.PI*2, true);
        context.closePath();
		context.fillStyle = color;
        context.fill();
    }
}


// draw the court boundaries...
function drawCourt(context) {
    // jail lines
	context.lineWidth = 2;
	
	context.beginPath();
	context.moveTo(theCanvas.width*.15, 0);
    context.lineTo(theCanvas.width*.15, theCanvas.height);
    context.stroke();
	
	context.beginPath();
	context.moveTo(theCanvas.width*.85, 0);
    context.lineTo(theCanvas.width*.85, theCanvas.height);
    context.stroke();
	
	// center of court
	context.lineWidth = 4;
	
	context.beginPath();
	context.moveTo(theCanvas.width*.5, 0);
    context.lineTo(theCanvas.width*.5, theCanvas.height);
    context.stroke();
}
// add an initial drawing of the court
drawCourt(canvasContext);


// Create player array and place them on court
function generatePlayers() {
	Team1 = []
	Team2 = []
	for (var i=0; i<N; i++){
		var radX = (Math.random()*.3+.175)*theCanvas.width;
		var radY = (Math.random()*.95+.025)*theCanvas.height;
		var radR = 5;
		Team1.push(new Player(radX, radY, radR));
		Team1[i].draw(canvasContext, "blue"); // initially draw out the circles
	}
	for (var i=0; i<N; i++){
		var radX = (Math.random()*.3+.525)*theCanvas.width;
		var radY = (Math.random()*.95+.025)*theCanvas.height;
		var radR = 5;
		Team2.push(new Player(radX, radY, radR));
		Team2[i].draw(canvasContext, "red");
	}
}
// generate the players once initially
generatePlayers();


//////////////////////////////// button functions ////////////////////////////////
// functions to start, stop, and reset the simulation
function Start() {
  if (!Sim){ Sim = setInterval(frame, 5); }
}

function pause() {
  if (Sim) { clearInterval(Sim); Sim = 0 }
};

function Reset() {
	// clear current simulation
	pause();
	wipe();
	
	//update params
	N = N_new;
	
	// Redraw court and players
	drawCourt(canvasContext);
	generatePlayers();
};

// to clear the screen
function wipe() {
	canvasContext.clearRect(0, 0, theCanvas.width, theCanvas.height);
}


function frame() {
  // clear screen
  wipe();
  // redraw court boundaries
  drawCourt(canvasContext);
  
  // Move players/ball
  for(var i=0; i<N; i++) {
     Team1[i].draw(canvasContext, "blue");
     Team1[i].x = Team1[i].x + Math.random()-.5;
     Team1[i].y = Team1[i].y + Math.random()-.5;
  }
  for(var i=0; i<N; i++) {
     Team2[i].draw(canvasContext, "red");
     Team2[i].x = Team2[i].x + Math.random()-.5;
     Team2[i].y = Team2[i].y + Math.random()-.5;
  }
  
}
