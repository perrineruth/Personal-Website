// Javascript code for running a Dodgeball Simulation

// canvas details
var theCanvas=document.getElementById("myCanvas");
var canvasContext=theCanvas.getContext("2d");
// force decent resolution even if it isn't variable...
theCanvas.width = 800;
theCanvas.height = 400;
// parameters
var N = 25;
var N_new = N; // placeholder for when updated
var lambda = .01;
var a1 = .5;
var a2 = .5;
var ke = 0.667;
var kj = 0.333;
// player array
var Team1, Team2, Court1, Court2, Jail1, Jail2;		// list of players, in court, in jail
var X1, X2;		// players on Team1/2
var Ball;		// ball object for drawing
var Sim = 0;	// if simulation is active
// time parameter (integer actual time = 5ms*tn)
var tn = 0;
var counter;
var state = "wait";
var Speedup;
// tracking purpose for throw (state parameters)
var Team, Aim, Target;
var Complete = 0; // game ended



////////// start, pause, and reset control//////////
var start_btn = document.getElementById("start");
start_btn.addEventListener("click", Start);
var pause_btn = document.getElementById("pause");   
pause_btn.addEventListener("click", pause)
var reset_btn = document.getElementById("reset");    
reset_btn.addEventListener("click", Reset)
var force_btn = document.getElementById("Force");    // force ball throw
force_btn.addEventListener("click", ForceThrow)
var accelerator = document.getElementById("accelerate"); // speed up game
accelerator.addEventListener("change", accelerate);



////////// parameter sliders //////////
// number of players
var N_range = document.getElementById("NRange");
var N_Label = document.getElementById("NLabel");
N_range.oninput = updateN;
// individual throw rate
var lambda_range = document.getElementById("LambdaRange");
var lambda_Label = document.getElementById("LambdaLabel");
lambda_range.oninput = updateLambda;
// team 1 strat
var a1_range = document.getElementById("a1Range");
var a1_Label = document.getElementById("a1Label");
a1_range.oninput = updatea1;
// team 2 strat
var a2_range = document.getElementById("a2Range");
var a2_Label = document.getElementById("a2Label");
a2_range.oninput = updatea2;
// opponent toss effectiveness
var ke_range = document.getElementById("keRange");
var ke_Label = document.getElementById("keLabel");
ke_range.oninput = updateke;
// jail toss effectiveness
var kj_range = document.getElementById("kjRange");
var kj_Label = document.getElementById("kjLabel");
kj_range.oninput = updatekj;




////////// Relevant random functions //////////
// exponential
function exp(lambda) {
	y = Math.random();
	x = -Math.log(1-y)/lambda;
	return x;
}

// random integer 0,...,N
function randint(N) {
	return Math.floor(Math.random()*N)
}


////////// functions to update parameters //////////
function updateN() {
	N_new = parseInt(this.value);
	N_Label.innerHTML = "N = " + N_new + " (Number of Players)";
}

function updateLambda() {
	// update throw rate
	lambda = (10**parseFloat(this.value));
	// limit digits and scientific notation
	lambda_text = (lambda.toFixed(3-parseFloat(this.value))*1).toExponential();
	lambda_Label.innerHTML = "&lambda; = " + lambda_text + " (Player throw rate)";
}

function updatea1() {
	a1 = parseFloat(this.value);
	a1_Label.innerHTML = "a1 = " + a1 + " (Strategy of Yellow Team)";
}

function updatea2() {
	a2 = parseFloat(this.value);
	a2_Label.innerHTML = "a2 = " + a2 + " (Strategy of Blue Team)";
}

function updateke() {
	ke = parseFloat(this.value);
	ke_Label.innerHTML = "ke = " + ke + " (Effectiveness Targeting Opponent Court)";
}

function updatekj() {
	kj = parseFloat(this.value);
	kj_Label.innerHTML = "kj = " + kj + " (Effectiveness Targeting Jail)";
}



//////////////////////// Functions for constructing and ball ////////////////////////
// Player Constructor
function Player(x,y,Team) {
    this.x = x;
    this.y = y;
	this.Team = Team;
	this.Status = 1; // players start in
    
	// draw circle at player position
    this.draw = function(){
		var ctx = canvasContext;
		
		// color
		if (this.Team == 1) {
			ctx.fillStyle = "#FFC20A"; // Yellow
		} else if (this.Team == 2) {
			ctx.fillStyle = "#0C7BDC"; // Blue
		} else { 
			alert("error: invalid team"); 
		}
		
		// head
        ctx.beginPath();
		var r = 7; // radius
        ctx.arc(this.x, this.y, r, 0, Math.PI*2, true);
        ctx.closePath();
		ctx.fill();
		
		// body
		ctx.beginPath();
		ctx.moveTo(this.x-10,this.y+20);
		ctx.lineTo(this.x+10,this.y+20);
		ctx.lineTo(this.x,this.y-4);
		ctx.closePath();
		ctx.fill();
    }
		
	// swap between court and jail
	this.swapPos = function() { 
		// Team 1
		if (this.Team == 1) {
			// in court -> jail
			if (this.Status) {
				this.x = (Math.random()*.125 + .8625)*theCanvas.width;
				this.y = (Math.random()*.95 + .025)*theCanvas.height-3.25; 
			}
			// in jail
			else{
				this.x = (Math.random()*.325 + .1625)*theCanvas.width;
				this.y = (Math.random()*.95 + .025)*theCanvas.height-3.25; 
			}
		}
		// Team 2
		else if (this.Team == 2) {
			if (this.Status) {
				this.x = (Math.random()*.125 + .0125)*theCanvas.width;
				this.y = (Math.random()*.95 + .025)*theCanvas.height-3.25; 
			}
			else{
				this.x = (Math.random()*.325 + .5125)*theCanvas.width;
				this.y = (Math.random()*.95 + .025)*theCanvas.height-3.25; 
			}
		} else { alert("error: invalid team"); }
		// change status of player
		this.Status = !this.Status;
	}

	// for randomly moving... makes it more function
	this.shuffle = function() {
		this.x = this.x + 4*Math.random() - 2;
		this.y = this.y + 2*Math.random() - 1;
		this.bound();
	}
	
	// keep player in bounds
	this.bound = function() {
		// left and right limits
		if (this.Team == 1) {
			if (this.Status) {
				Left 	= 	(.15+.025)*theCanvas.width;
				Right 	= 	(.5-.025)*theCanvas.width;
			} else {
				Left 	= 	(.85+.025)*theCanvas.width;
				Right 	= 	(1-.025)*theCanvas.width;
			}
		} else if (this.Team == 2) {
			if (this.Status) {
				Left 	= 	(.5+.025)*theCanvas.width;
				Right 	= 	(.85-.025)*theCanvas.width;
			} else {
				Left 	= 	(0+.025)*theCanvas.width;
				Right 	= 	(.15-.025)*theCanvas.width;
			}
		} else { alert("error: invalid team") }
		
		// upper and lower limits 3.25 adjust mismatch in centers
		Top = .95*theCanvas.height - 6.5;
		Bottom = .05*theCanvas.height - 6.5;
		
		this.x = Math.max(Math.min(this.x,Right),Left);
		this.y = Math.max(Math.min(this.y,Top),Bottom);
	}
}

function Ball() {
	// place at center for simplicity
	this.x = 0.5*theCanvas.width;
	this.y = 0.5*theCanvas.height;
	this.Status = 0; // currently no ball
	
	// draw
	this.draw = function() {
		if (this.Status == "toss") {
			this.toss(canvasContext);
		} else if (this.Status == "hit") {
			this.hit(canvasContext);
		} else if (this.Status) { alert("error: invalid ball state") } // otherwise should be out of play or 0
	}
	
	// draw ball in play
	this.toss = function(ctx) {
		ctx.beginPath();
		var r = 7;
		ctx.arc(this.x, this.y, r, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fillStyle = "#D41159"; // Red
		ctx.fill();
	}

	// draw ball when it hits
	this.hit = function(ctx) {
		ctx.beginPath();
		ctx.moveTo(this.x-8,  this.y-12);
		ctx.lineTo(this.x-6,  this.y-4); 	ctx.lineTo(this.x-12, this.y+4);
		ctx.lineTo(this.x-4,  this.y+3); 	ctx.lineTo(this.x-6,  this.y+12);
		ctx.lineTo(this.x-2,  this.y+5); 	ctx.lineTo(this.x+6,  this.y+8);
		ctx.lineTo(this.x+4,  this.y+3); 	ctx.lineTo(this.x+12, this.y-1);
		ctx.lineTo(this.x+3,  this.y-4.5);  ctx.lineTo(this.x+3,  this.y-12);
		ctx.lineTo(this.x-3,  this.y-5.5);
		ctx.closePath();
		ctx.fillStyle = "#D41159"; // Red
		ctx.fill();
	}
	
}


// draw the court boundaries...
function drawCourt() {
    var ctx = canvasContext;
	
	// jail lines
	ctx.lineWidth = 2;
	
	ctx.beginPath();
	ctx.moveTo(theCanvas.width*.15, 0);
    ctx.lineTo(theCanvas.width*.15, theCanvas.height);
    ctx.stroke();
	
	ctx.beginPath();
	ctx.moveTo(theCanvas.width*.85, 0);
    ctx.lineTo(theCanvas.width*.85, theCanvas.height);
    ctx.stroke();
	
	// center of court
	ctx.lineWidth = 4;
	
	ctx.beginPath();
	ctx.moveTo(theCanvas.width*.5, 0);
    ctx.lineTo(theCanvas.width*.5, theCanvas.height);
    ctx.stroke();
}

// Create player array and place them on court
function generatePlayers() {
	Team1 = [];		Team2 = [];
	Court1 = []; 	Court2 = [];
	Jail1 = []; 	Jail2 = [];
	X1 = N;			X2 = N;
	// left team
	for (var i=0; i<N; i++){
		// X coordinate by court edge
		var X = (.475)*theCanvas.width; 			// pos at the right
		// y position, 3.25 to adjust center of head -> center of player
		if (N > 1) 			{ var Y = (i/(N-1)*.9+.05)*theCanvas.height-6.5; } // evenly spaced 
		else if (N = 1) 	{ var Y = 1/2*theCanvas.height-6.5; }
		else 				{ alert("error") }
		Team1.push(new Player(X, Y, 1));
		Court1.push(i);		// say they're in the court to start
		Team1[i].draw();	// initially draw out the circles
	}
	// right team
	for (var i=0; i<N; i++){
		var X = (.525)*theCanvas.width;
		if (N > 1) 			{ var Y = (i/(N-1)*.9+.05)*theCanvas.height-6.5; } // evenly spaced 
		else if (N = 1) 	{ var Y = 1/2*theCanvas.height-6.5; }
		else 				{ alert("error") }
		Team2.push(new Player(X, Y, 2));
		Court2.push(i);
		Team2[i].draw();
	}
}

// Initially draw out the players and court and create a ball
drawCourt();
generatePlayers();
ball = new Ball();



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
	
	// reset cycle
	Counter = Math.floor(exp(2*N*lambda)/0.0050);
	tn = 0;
	state = "wait";
	
	// make sure no player pauses
	Target = "Null"
	
	//update params
	N = N_new;
	
	// Redraw court and players
	drawCourt(canvasContext);
	generatePlayers();
}

function ForceThrow() {
	if (state == "wait") {
		state = "throw";
	}
}

function accelerate() {
	if (accelerator.checked) 	{ Speedup = 1 } 
	else 						{ Speedup = 0; }
}

// to clear the screen
function wipe() {
	canvasContext.clearRect(0, 0, theCanvas.width, theCanvas.height);
}



Counter = Math.floor(exp(2*N*lambda)/0.005);



///////// driving clock of the simulation /////////
function frame() {
	// check win conditions
	if (X1 == 0 || X2 == 0) {
		pause();
		var ctx = canvasContext;
		ctx.font = "20px Georgia";
		if (X1 > 0 && X2 == 0) {
			ctx.fillText("Yellow Team Wins!", 0.175*theCanvas.width,0.5*theCanvas.height+10);
		} else if (X1 == 0 && X2 > 0) {
			ctx.fillText("Blue Team Wins!", 0.525*theCanvas.width,0.5*theCanvas.height+10);
		}
		
	}
	else{
	
	// clear screen
	wipe();
	
	// redraw court boundaries
	drawCourt();
	
	
	// evaluate state
	// extra { } are for shrinking cases not for a functional purpose
	switch(state) {
		case "wait": {
			Target = "Null";
			ball.Status = 0;
			if (tn >= Counter || Speedup) {
				state = "throw";	// finished delay throwing time
				tn = 0;				// reset timer
			} else { tn += 1; } 	// waiting... increment timer
			break; }
		case "throw": {
			// find throwing team thrower target etc
			// Team 1 has it
			if ( Math.random() <= X1/(X1+X2) ) {
				Team = 1;
				// choose an individual (and location)
				Thrower = Court1[randint(X1)];
				z0 = [Team1[Thrower].x, Team1[Thrower].y];
				
				// find the aim and an individual target if possible
				if (Math.random() <= a1) {
					Aim = "opponent";
					Target_Index = randint(X2);
					Target = Court2[Target_Index];
					z1 = [Team2[Target].x, Team2[Target].y];
				} else {
					Aim = "jail";
					// if there's a target
					if (N-X1 > 0) {
						Target_Index = randint(N-X1);
						Target = Jail1[Target_Index];
						z1 = [Team1[Target].x, Team1[Target].y];
					} else {
						// throw it randomly into jail
						Target_Index = "Null";
						Target = "Null";
						z1 = [(Math.random()*.125 + .8625)*theCanvas.width,
							(Math.random()*.95 + .025)*theCanvas.height-3.25]; 
					}
				}
			} else { 
				Team = 2; 
				Thrower = Court2[randint(X2)];
				z0 = [Team2[Thrower].x, Team2[Thrower].y];
				
				// find the aim and an individual target if possible
				if (Math.random() <= a2) {
					Aim = "opponent";
					Target_Index = randint(X1);
					Target = Court1[Target_Index];
					z1 = [Team1[Target].x, Team1[Target].y];
				} else {
					Aim = "jail";
					// if there's a target
					if (N-X2 > 0) {
						Target_Index = randint(N-X2);
						Target = Jail2[Target_Index];
						z1 = [Team2[Target].x, Team2[Target].y];
					} else {
						// throw it randomly into jail
						Target_Index = "Null";
						Target = "Null"
						z1 = [(Math.random()*.125 + .0125)*theCanvas.width,
							(Math.random()*.95 + .025)*theCanvas.height-3.25]; 
					}
				}
			}
			
			//z1 = [theCanvas.width-z0[0], theCanvas.height-z0[1]]
			
			dist = Math.sqrt((z1[0]-z0[0])**2+(z1[1]-z0[1])**2)
			
			ball.x = z0[0];
			ball.y = z0[1];
			ball.Status = "toss";
			tn = 0;
			Counter = Math.floor(1/0.005);
			state = "in_air";
			break; }
		case "in_air": {
			if (tn <= (dist*.75) && (!Speedup)) {
				ball.x = z0[0]*(1-tn/(dist*.75)) + z1[0]*tn/(dist*.75);
				ball.y = z0[1]*(1-tn/(dist*.75)) + z1[1]*tn/(dist*.75);
				ball.Status = "toss";
				tn+=1;
				//alert("here");
			} else { 
				state = "hit";		// finished delay throwing time
				tn = 0;				// reset timer
			}
			break; }
		case "hit": {
			ball.x = z1[0];
			ball.y = z1[1];
			
			// find out what happened and update some values
			if (Team == 1) {
				// who's targetted
				if (Aim == "opponent") {
					if (Math.random() <= ke*X2/N) {
						Jail2.push(Target);
						Court2.splice(Target_Index,1);
						X2--;
						Team2[Target].swapPos();
						ball.Status = "hit";
						state = "delay_hit";
						Counter = Math.floor(0.5/0.005);
					} else {
						ball.Status = 0;
						state = "wait";
						Counter = Math.floor(exp((X1+X2)*lambda)/0.005);
					}
				} else if (Aim == "jail") {
					if (Math.random() <= kj*(N-X1)/N) {
						Court1.push(Target);
						Jail1.splice(Target_Index,1);
						X1++;
						Team1[Target].swapPos();
						ball.Status = "hit";
						state = "delay_hit";
						Counter = Math.floor(0.5/0.005);
					} else {
						ball.Status = 0;
						state = "wait";
						Counter = Math.floor(exp((X1+X2)*lambda)/0.005);
					}
				} else { alert(["error: invalid aim"]); }
			} else if (Team == 2) {
				if (Aim == "opponent") {
					if (Math.random() <= ke*X1/N) {
						Jail1.push(Target);
						Court1.splice(Target_Index,1);
						X1--;
						Team1[Target].swapPos();
						ball.Status = "hit";
						state = "delay_hit";
						Counter = Math.floor(0.5/0.005);
					} else {
						ball.Status = 0;
						state = "wait";
						Counter = Math.floor(exp((X1+X2)*lambda)/0.005);
					}
				} else if (Aim == "jail") {
					if (Math.random() <= kj*(N-X2)/N) {
						Court2.push(Target);
						Jail2.splice(Target_Index,1);
						X2++;
						Team2[Target].swapPos();
						ball.Status = "hit";
						state = "delay_hit";
						Counter = Math.floor(0.5/0.005);
					} else {
						ball.Status = 0;
						state = "wait";
						Counter = Math.floor(exp((X1+X2)*lambda)/0.005);
					}
				} else { alert(["error: invalid aim"]); }
			} else { alert("error: invalid team"); }
			
			
			tn = 0;
			break; }
		case "delay_hit": {
			if (tn >= Counter) {
				state = "wait";	// finished delay throwing time
				tn = 0;				// reset timer
				Counter = Math.floor(exp((X1+X2)*lambda)/0.005);
			} else { tn += 1; } 	// waiting... increment timer
			break; }	
		default: {
			alert("error: invalid case");
			break; }
	}
  
  
	// Draw and then move players
	for(var i=0; i<N; i++) {
		Team1[i].draw();
		if (Target != i || (Team == 1 && Aim == "opponent") || (Team == 2 && Aim == "jail")){
			Team1[i].shuffle();
		}
	  
		Team2[i].draw();
		if (Target != i || (Team == 2 && Aim == "opponent") || (Team == 1 && Aim == "jail")){
			Team2[i].shuffle();
		}
	}
	
	
	ball.draw();
	
	tn += 1;
}}
