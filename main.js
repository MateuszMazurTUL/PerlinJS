//canvas
var ctx = $("#perlinL")[0].getContext("2d");
ctx.canvas.width  = window.innerWidth;
ctx.canvas.height = window.innerHeight;

var config = {
    sizeChunk: 800,
    
    seed:  window.prompt('Seed'),
    //seed:  0.12,  
    
    numOfOctaves: 9,
    
    //TODO: check prompt is number
    water_lvl: window.prompt('Water level', 0.4),  //0.4
    sand_lvl: window.prompt('Sand level', 0.43),  //0.43
    grass_lvl: window.prompt('Grass level', 0.83), //0.83
    
    numOfTowns: window.prompt('Number of towns', 4),
    maxAStarTime: window.prompt('Maximum time(sec) for single A* search', 10),
}
/*function InterpolateLinear(x0, x1, alpha) {
    return x0 * (1 - alpha) + alpha * x1;
}*/

//interoplation function
function Interpolate(x0, x1, alpha) {
    var beta = (1 - Math.cos(alpha * Math.PI)) / 2;
    return x0 * (1 - beta) + x1 * beta;
}

//fullfill ArrayChunk with 0 or 1 value, depend on chunk
function generateChunk(chunk_X,chunk_Y,array){
    //TODO: error: check parameter is number
    //TODO: change  chunk_X * 100 to variable
    for (var i = 0 + chunk_X * 100; i < config.sizeChunk + chunk_X * 100; i++) {
        array[i - chunk_X * 100]=[];
        for (var j = 0 + chunk_Y * 100; j < config.sizeChunk + chunk_Y * 100; j++) {
            
            // set seed for each individual point and chunk
            Math.seedrandom(config.seed+"chunk_X"+chunk_X+"chunk_Y"+chunk_X+"i"+i+"j"+j);
            
            //input 0 or 1 into array
            array[i - chunk_X * 100][j - chunk_Y * 100] = Math.floor((Math.random() * 2));
        }
    }
    return array;
}

//smooth array TODO: clean up the mess with array
function smoothNoise(octave){
    //var ArraySmooth = [];
    
    //1, 2 ,4 ,8, 16...
    let samplePeriod = 1 << octave;
    let sampleFrequency = 1 / samplePeriod;
    ArraySmooth[octave] = [];
    
    for (let i = 0; i < config.sizeChunk; i++) {
        //i0,j0 is the orgin of samplePeriod(1,2,4,8...) and i1,j1 is the end
        let sample_i0 = Math.floor( i / samplePeriod) * samplePeriod;
        let sample_i1 = (sample_i0 + samplePeriod) % config.sizeChunk;
        let horizontal_blend = ( i - sample_i0) * sampleFrequency;
        
        ArraySmooth[octave][i]=[];
        
        for (let j = 0; j < config.sizeChunk; j++) {
            //i0,j0 is the orgin of samplePeriod(1,2,4,8...) and i1,j1 is the end
            let sample_j0 = Math.floor(( j / samplePeriod)) * samplePeriod;
            let sample_j1 = (sample_j0 + samplePeriod) % config.sizeChunk;
            let vertical_blend = ( j - sample_j0) * sampleFrequency;
            // blend is for interpolation, then interpolate top/bot, 
            let top = Interpolate(ArrayChunk[sample_i0][sample_j0],
            ArrayChunk[sample_i1][sample_j0], horizontal_blend);
 
            let bottom = Interpolate(ArrayChunk[sample_i0][sample_j1],
            ArrayChunk[sample_i1][sample_j1], horizontal_blend);
            //then interpolate all together
            ArraySmooth[octave][i][j] = Interpolate(top, bottom, vertical_blend);
        }
    }
}

//blend octaves together
function blendNoise(octaveCount){
    //create obj config
    var persistance = 0.5;
    var amplitude = 1.0;
    var totalAmplitude = 0.0;
    var weight;
    
    //generate all octaves
    for (var i = 0; i < octaveCount; i++) {
        smoothNoise(i);
    }
    
    //create all arrays
    for (var i = 0; i < config.sizeChunk; i++) {
        ArrayNoise[i] = [];
        for (var j = 0; j < config.sizeChunk; j++) {
            ArrayNoise[i][j] = 0 ;//* amplitude;
        }
    }
    
    for (var octave = octaveCount - 1; octave >= 0; octave--) {
        //some settings for octaves' weight, less = octeve haven't impact for result
        //TODO: if octave[x] == 0 we shouldn't smoothNoise
        if(octave == 0) weight = 0;
        else if (octave == 1) weight = 0.1;
        else if (octave == 2) weight = 0.1;
        else if (octave == 3) weight = 0.7;
        else if (octave == 4) weight = 0.9;
        else if (octave == 5) weight = 1;
        else if (octave == 6) weight = 1;
        else if (octave == 7) weight = 1;
        else if (octave == 8) weight = 1;
        else if (octave == 9) weight = 1;
        else if (octave == 10) weight = 1;
        else if (octave == 11) weight = 1;
        else if (octave == 12) weight = 1;
        else weight = 1
        
        //heigher octave have heigher multiplicity of amplitude
        amplitude *= persistance;
        totalAmplitude += amplitude;
        for (var i = 0; i < config.sizeChunk; i++) {
            for (var j = 0; j < config.sizeChunk; j++) {
                ArrayNoise[i][j] += ArraySmooth[octave][i][j] * amplitude * weight;
                //ArrayNoise[i][j] = Math.pow(ArrayNoise[i][j],1.00);
            }
        }
    }
 
   //normalisation to val [0-1]
   for (var i =  0; i < config.sizeChunk; i++) {
      for (var j =  0; j < config.sizeChunk; j++){
         ArrayNoise[i][j] /= totalAmplitude;
      }
   }
}

//drawing class TODO: adapt to multiple chunks TODO: width, height are constant ctx. make it clarify
function Draw(width, height){
    this.imgData = ctx.getImageData(0, 0, config.sizeChunk, config.sizeChunk);
    //ctx.putImageData( imgData, width, height);
}
//draw pixel by pixel whole chunk's array
Draw.prototype.map = function(width, height) {
    for (var i = 0; i < config.sizeChunk; i++) {
        for (var j = 0; j < config.sizeChunk; j++) {
            
            if(ArrayNoise[i][j] > config.grass_lvl) { //MOUNTAINS
                this.pixel(i, j, 
                (1-ArrayNoise[i][j]) * 255, //linear here
                (1-ArrayNoise[i][j]) * 255,
                (1-ArrayNoise[i][j]) * 255,
                255);
            } else if(ArrayNoise[i][j] < config.grass_lvl && ArrayNoise[i][j] > config.sand_lvl) { // Grass
                this.pixel(i, j,
                           grad(config.sand_lvl, config.grass_lvl, ArrayNoise[i][j], 30, 100, 0.95, 0),
                           grad(config.sand_lvl, config.grass_lvl, ArrayNoise[i][j], 200, 120), grad(config.sand_lvl, config.grass_lvl, ArrayNoise[i][j], 30, 100, 0.95, 0), 255);
            } else if(ArrayNoise[i][j] < config.sand_lvl && ArrayNoise[i][j] > config.water_lvl) {  // SAND
                this.pixel(i, j, 
                           grad(config.water_lvl, config.sand_lvl, ArrayNoise[i][j], 255, 180),   grad(config.water_lvl, config.sand_lvl, ArrayNoise[i][j], 255, 180),
                           0,
                           255);
            } else { // WATER
                this.pixel(i, j, 
                           0,
                           0,
                           grad(0, config.water_lvl, ArrayNoise[i][j], 70, 180, 0.80, grad(0, config.water_lvl, ArrayNoise[i][j], 55, 70)),
                           255);
            }
        }
    }
    ctx.putImageData(this.imgData, width, height);
};
//draw all towns form town.towns in points error: on border of chunk, the town pass to opsite side
Draw.prototype.town = function(width, height){
    for(let i = 0; i < town.towns.length; i++){
        //size of town
        let r = 10;
        var z = town.towns[i];
        //colors
        var col1 = 215 ; var col2 = 120;
        
        //circle TODO: replace this.imgData.data with this.pixel
        for(var a = 0; a < (r / Math.SQRT2); a++) {
            h = Math.round( Math.sqrt(r*r-a*a) );
            ///////////////////1 dir, NE, [X,Y]
            for(var h2 = h; h2 >= -h; h2--){
                this.imgData.data[(z.x + a) * 4  + (z.y + h2) * config.sizeChunk * 4 + 0] =
                grad(0, 1, grad(h, 0, Math.abs(h2), 0, 1) * grad(r, 0, a, 0, 1), col1, col2);
                this.imgData.data[(z.x + a) * 4  + (z.y + h2) * config.sizeChunk * 4 + 1] = 0;
                this.imgData.data[(z.x + a) * 4  + (z.y + h2) * config.sizeChunk * 4 + 2] = 0;
                
            ///////////////////2 dir, NW, [-X,Y]
                this.imgData.data[(z.x - a) * 4  + (z.y + h2) * config.sizeChunk * 4 + 0] =
                grad(0, 1, grad(h, 0, Math.abs(h2), 0, 1) * grad(r, 0, a, 0, 1), col1, col2);
                this.imgData.data[(z.x - a) * 4  + (z.y + h2) * config.sizeChunk * 4 + 1] = 0;
                this.imgData.data[(z.x - a) * 4  + (z.y + h2) * config.sizeChunk * 4 + 2] = 0;
            }
            
            ///////////////////3 dir, E, [-Y,X]
            for(var a2 = a; a2 >= -a; a2--){
                this.imgData.data[(z.x - h) * 4  + (z.y + a2) * config.sizeChunk * 4 + 0] =
                grad(0, 1, grad(a, 0, Math.abs(a2), 0, 1) * grad(r, 0, h, 0, 1), col1, col2);
                this.imgData.data[(z.x - h) * 4  + (z.y + a2) * config.sizeChunk * 4 + 1] = 0;
                this.imgData.data[(z.x - h) * 4  + (z.y + a2) * config.sizeChunk * 4 + 2] = 0;
                
            ///////////////////4 dir, W, [Y,X]
                this.imgData.data[(z.x + h) * 4  + (z.y + a2) * config.sizeChunk * 4 + 0] =
                grad(0, 1, grad(a, 0, Math.abs(a2), 0, 1) * grad(r, 0, h, 0, 1), col1, col2);
                this.imgData.data[(z.x + h) * 4  + (z.y + a2) * config.sizeChunk * 4 + 1] = 0;
                this.imgData.data[(z.x + h) * 4  + (z.y + a2) * config.sizeChunk * 4 + 2] = 0;
            }
        }
    }
    
    //quad
    /*for(var i = 0; i < Town.length; i++){
        var z = Town[i];
        for(var j = 0; j < 20; j++) {
            for(var jj = 0; jj < 20; jj++) {
                this.imgData.data[(z.y * config.sizeChunk * 4) + (jj * config.sizeChunk * 4) + (j * 4 + z.x * 4) + 0] = 255;
                this.imgData.data[(z.y * config.sizeChunk * 4) + (jj * config.sizeChunk * 4) + (j * 4 + z.x * 4) + 1] = 0;
                this.imgData.data[(z.y * config.sizeChunk * 4) + (jj * config.sizeChunk * 4) + (j * 4 + z.x * 4) + 2] = 0;
            }
        }
    }*/
    ctx.putImageData(this.imgData, width, height);
};
//draw all roads
Draw.prototype.road = function(width, height, index){

	//console.log(ArrayRoads[index]);
    for(var i = 0; ArrayRoads[index][i]; i++){
        this.pixel(ArrayRoads[index][i].x, ArrayRoads[index][i].y,
            215,215,215,255);
    }
    ctx.putImageData(this.imgData, width, height);
};
//draw a single pixel
Draw.prototype.pixel = function(width, height, R, G, B, A){
    this.imgData.data[(height*config.sizeChunk*4)+width*4] = R//RED
    this.imgData.data[(height*config.sizeChunk*4)+width*4+1] = G //GREEN
    this.imgData.data[(height*config.sizeChunk*4)+width*4+2] = B //BLUE
    this.imgData.data[(height*config.sizeChunk*4)+width*4+3] = A; //ALPHA
};

//create gradient TODO: add to Draw.protototype
function grad(a1, b1, c, a2, b2, x, y){
    var p = (c - a1) / (b1 - a1);
    if(!x) x = 0; // zakres 0.0-1.0
    if (p >= x) {
        if(x != 0) p = grad(x, 1, p, 0, 1);
        //return (b2 * p) - (a2 * p) + a2; 
        return (b2 - a2) * p + a2;
    } else
        return y;
}

//depreciated
function TownManager(){
	this.townList = [];
}
TownManager.prototype.newTown = function(){	
	this.townList.push();
}
/*function Town(){
    this.posX = ;
    this.posY = ;
	this.population = ;
    this.size = ;
	this.nation = ;
}*/

function Town(){
    this.towns = [];
    this.size = Math.floor(Math.random() * 10 + 10)
}
Town.prototype.create = function(nOfTowns){
    for (var i = 0; i < nOfTowns; i++){
        var x = Math.floor(Math.random()*config.sizeChunk);
        var y = Math.floor(Math.random()*config.sizeChunk);
        if(ArrayNoise[x][y] < config.grass_lvl && ArrayNoise[x][y] > config.sand_lvl){
            this.towns.push({x: x, y: y});
        }
        else i--;
        //warunek kończący jeżeli nie ma dostępnego terenu
    }
};


//A-STAR ALGORITHM
function aStar(sX, sY, eX,eY){
    //timestamp
    time.Start("aStar");
    console.log("Start: "+sX+"|"+sY+"       End: "+eX+"|"+eY);
    
    
    var F, G, H; //
    var ArrayStar = [];
    var lowF, lowFirst, arrL, firstTime;
    var acc_X = sX, acc_Y = sY;
    
    
    ArrayStar[acc_X] = [];
    ArrayStar[acc_X][acc_Y] = [];
    // X Y [O P F G H]
    
    //First point for our search
    ArrayStar[acc_X][acc_Y] = {Open: true, Parent: false, F: false, G: 0, H: ((Math.abs(acc_X - eX) + Math.abs((acc_Y - eY))) * 10)};
    
    //directions N, NE, E, SE, S, SW, W, NW
    
    //all direction x,y is direction c is move cost
    var ArrayDir = [ 
        {x: 0, y: -1, c: 10},
        {x: 1, y: -1, c: 14},
        {x: 1, y: 0, c: 10},
        {x: 1, y: 1, c: 14},
        {x: 0, y: 1, c: 10},
        {x: -1, y: 1, c: 14},
        {x: -1, y: 0, c: 10},
        {x: -1, y: -1, c: 14}
    ];
    
    do{ 
    	ArrayDir.forEach(function(dir, index){
            
            //check ArrayNoise is existing
			if(!(!ArrayNoise[acc_X + dir.x] || !ArrayNoise[acc_X + dir.x][acc_Y + dir.y])){
                //check node existing, add default
				if(!ArrayStar[acc_X + dir.x]) ArrayStar[acc_X + dir.x] = [];
				if(!ArrayStar[acc_X + dir.x][acc_Y + dir.y]) ArrayStar[acc_X + dir.x][acc_Y + dir.y] = {Open: null, Parent:  null, F: null, G: null, H: null};
			} 
            
            //old(actual for this node) G
			G = ArrayStar[acc_X][acc_Y].G + dir.c;
			//add G and F for open node if new G < old G
			if(!(!ArrayNoise[acc_X + dir.x] || !ArrayNoise[acc_X + dir.x][acc_Y + dir.y])){
                if(ArrayStar[acc_X + dir.x][acc_Y + dir.y].Open == true && ArrayStar[acc_X + dir.x][acc_Y + dir.y].G > G) {
                    F = G + ArrayStar[acc_X + dir.x][acc_Y + dir.y].H;
                    //set parent for next node as actual node
                    ArrayStar[acc_X + dir.x][acc_Y + dir.y] = {Parent: {x: -dir.x, y: -dir.y}, F: F, G: G,};
                }
            }
            
			//Create new nodes
            if(!(!ArrayNoise[acc_X + dir.x] || !ArrayNoise[acc_X + dir.x][acc_Y + dir.y])){
                if(!ArrayStar[acc_X + dir.x][acc_Y + dir.y].Open && ArrayStar[acc_X + dir.x][acc_Y + dir.y].Open != false ) {
                    //For grass and sand
                    if (ArrayNoise[acc_X + dir.x][acc_Y + dir.y] < config.grass_lvl && ArrayNoise[acc_X + dir.x][acc_Y + dir.y] > config.sand_lvl){
                        H = (Math.abs((acc_X + dir.x - eX)) + Math.abs((acc_Y + dir.y - eY))) * 10;
                        G = ArrayStar[acc_X][acc_Y].G + dir.c;
                        F = G + H;
                        ArrayStar[acc_X + dir.x][acc_Y + dir.y] = {Open: true, Parent: {x: -dir.x, y: -dir.y}, F: F, G: G, H: H};
                    } else { //for water and mountains
                        H = (Math.abs((acc_X + dir.x - eX)) + Math.abs((acc_Y + dir.y - eY))) * 10 * 100;
                        G = ArrayStar[acc_X][acc_Y].G + dir.c * 100;
                        F = G + H;
                        ArrayStar[acc_X + dir.x][acc_Y + dir.y] = {Open: true, Parent: {x: -dir.x, y: -dir.y}, F: F, G: G, H: H};
                    }
                }
            }
		});
        
        //Close node
        ArrayStar[acc_X][acc_Y].Open = false;
        
        // Search for lowest F
        arrL = ArrayStar.length;
        firstTime = true;
        lowF = false;
        for(var i = 0; i < arrL; i++) {
            if (ArrayStar[i]) {
                for(var j = 0; j < ArrayStar[i].length; j++) {
                    if (ArrayStar[i][j]) {
                        if((ArrayStar[i][j].Open == true && ArrayStar[i][j].F <= lowF) || (ArrayStar[i][j].Open == true && !lowF)){
                            if ((ArrayStar[acc_X][acc_Y].H > ArrayStar[i][j].H) || firstTime == true){
                                lowF = ArrayStar[i][j].F;
                                acc_X = i;
                                acc_Y = j;
                                firstTime = false;
                                
                            }
                        }
                    }
                }
            }
        }
        //draw.pixel(acc_X,acc_Y, 0, 0, 255, 160); //check
        
        //end if path no exist
        var end = true;
        arrL = ArrayStar.length;
        for(var i = 0; i < arrL; i++) {
            if (ArrayStar[i]) {
                for(var j = 0; j < ArrayStar[i].length; j++) {
                    if (ArrayStar[i][j]) {
                        if(ArrayStar[i][j].Open == true){
                            end = false;
                        }
                    }
                }
            }
        }
        //end if time
        if(time.check("aStar") > config.maxAStarTime) {
            end = true;
            console.log('No route!');
        }
        
        
    } while(ArrayStar[acc_X][acc_Y].H != 0 && end == false);
    time.Show("aStar");
    
    //CREATE ROUTE
    var road = [];
    while(ArrayStar[acc_X][acc_Y].Parent != false){
        road.push({x: acc_X, y:acc_Y});
		let temp = acc_X;
		acc_X += ArrayStar[acc_X][acc_Y].Parent.x;
		acc_Y += ArrayStar[temp][acc_Y].Parent.y;
    }
    ArrayRoads.push(road);
}

//timestamps TODO: Start -> start, Show -> show
function Timer(){
    this.ArrayTime = [];
}
Timer.prototype.Start = function(temp){
    this.ArrayTime[temp] = new Date().getTime();
}
Timer.prototype.Show = function(temp){
    console.log("%c" + (temp + ": " + ((new Date().getTime() - this.ArrayTime[temp]) / 1000) + " sec"), 'background: #222; color: #bada55');
}
Timer.prototype.check = function(temp){
    return ((new Date().getTime() - this.ArrayTime[temp]) / 1000);
}

//TODO: clean up the mess with array, each function should return array
{
    var ArrayBase = [];
    var ArraySmooth = [];
    var ArrayNoise = [];
    //var ArrayImg = [];
    var ArrayChunk = [];
    var ArrayChunks = [];
    var ArrayRoads = [];

    var time = new Timer();
    var draw = new Draw();
    var town = new Town();
}

//START
time.Start("start");

//Generate map
for(var i = 0; i < 1; i++){ //TODO: make implementation more then one chunk
    for(var j = 0; j < 1; j++){
        time.Start("genChunk");
        generateChunk(i,j,ArrayChunk);
        blendNoise(config.numOfOctaves);
        time.Show("genChunk");
    }
}

//create towns
town.create(config.numOfTowns);

//DRAW
for(var i = 0; i < 1; i++){
    for(var j = 0; j < 1; j++){
        draw.map(0 + i * config.sizeChunk,0 + j * config.sizeChunk);
        draw.town(0,0);
    }
}


//aStar for each town with random 1 or 2 other
town.towns.forEach(function(pos, index){
    for(var i = 0; i < Math.floor((Math.random()*2)+1); i++){ //with 1 or 2 other
        var target = town.towns[Math.floor((Math.random()*town.towns.length))]; //random target
        //console.log("x: "+pos.x+" y: "+ pos.y+" tx: "+ target.x+" ty: "+ target.y);
        if(target != town.towns[index]) aStar(pos.x, pos.y, target.x, target.y);
    }
});
//draw road
town.towns.forEach(function(pos, index){
    draw.road(0,0, index);
});

time.Show("start");