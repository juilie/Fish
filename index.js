async function getModel() {
    var model = roboflow
        .auth({
            publishable_key: "rf_2as583zp3EW9LeyHVCBywmOQyKi2",
        })
        .load({
            model: "fish-annotated",
            version: 1,
        });

    return model;
}

var initialized_model = getModel();

let vid;
let coin;
let coinFX;
let mvpSong;
let cottoneye;
let hat;
let zoomGraphics;

let font;

let detectionRadius = 200;
let lastCameraShow = 0;
let cameraDebounceTime = 500;
let cameraActive = false;

function preload() {
    coin = loadImage('./assets/coin.png');
    hat = loadImage('./assets/hat.png');
    coinFX = loadSound('assets/coin.wav');
    mvpSong = loadSound('assets/mvpSong.wav');
    cottoneye = loadSound('assets/cottoneye.wav');
    font = loadFont('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc9.ttf');
}

let coins = []

function setup() {
    createCanvas(1280, 720);
    vid = createVideo('./assets/aquariumNonLFS.mp4', videoLoaded);
    vid.hide();
    
    // Create loading container
    let loadingContainer = createDiv('');
    loadingContainer.addClass('loading-container');
    
    // Create loading spinner
    let loadingSpinner = createDiv('');
    loadingSpinner.addClass('loading-spinner');
    loadingContainer.child(loadingSpinner);
    
    // Create loading text
    let loadingText = createDiv('Initializing Model...');
    loadingText.addClass('loading-text');
    loadingContainer.child(loadingText);
    
    // Create start button (initially hidden)
    let playButton = createButton('Click to Start');
    playButton.addClass('start-button hidden');
    
    // Add initial coins
    coins.push(new coinClass(width - 150, height - 150, 50)); // Bottom right area
    coins.push(new coinClass(width/4, height - 200, 50)); // Bottom left area
    coins.push(new coinClass(width - 270, 90, 50)); // Top right area
    coins.push(new coinClass(width/2-100, 100, 50)); // Top left area
    
    // Wait for both video and model to load
    Promise.all([
        new Promise(resolve => {
            vid.elt.addEventListener('loadeddata', resolve);
        }),
        initialized_model
    ]).then(() => {
        loadingContainer.remove();
        playButton.removeClass('hidden');
    });
    
    playButton.mousePressed(() => {
        playButton.html('Loading');
        playButton.addClass('loading');
        playButton.attribute('disabled', '');
        
        setTimeout(() => {
            vid.loop();
            vid.volume(0);
            playButton.remove();
        }, 1500);
    });
    
    // Create both graphics buffers
    zoomGraphics = createGraphics(400, 250);
    zoomGraphicsWebGL = createGraphics(400, 250, WEBGL);
}

// Add this new function to handle video loading
function videoLoaded() {
    vid.volume(0);
}

function mouseClicked() {
    console.log("click");
    coins.push(new coinClass(mouseX, mouseY, 50));
}
let objects = []

let zoomScale = 2; // The scale of zoom
let zoomX = 150; // X-coordinate of the top-left corner of the zoom area
let zoomY = 100; // Y-coordinate of the top-left corner of the zoom area
let zoomWidth = 320; // Width of the zoom area
let zoomHeight = 180;

let showWinner = false;
let showHat = false;
let winner;
let mvpPic;

function drawZoomFrame() {
    // Draw zoom frame if there's a detected fish near a coin
    if (objects[0] && coins.length > 0) {
        const fish = objects[0];
        
        // Check if fish is near any ACTIVE coin
        let nearestCoin = null;
        let minDist = Infinity;
        
        coins.forEach(coin => {
            if (coin.hitbox) {
                let d = dist(fish.bbox.x, fish.bbox.y, coin.x, coin.y);
                if (d < detectionRadius && d < minDist) {
                    minDist = d;
                    nearestCoin = coin;
                }
            }
        });
        
        // Handle camera debouncing
        if (nearestCoin) {
            if (!cameraActive && millis() - lastCameraShow > cameraDebounceTime) {
                cameraActive = true;
                lastCameraShow = millis();
            }
        } else {
            if (cameraActive && millis() - lastCameraShow > cameraDebounceTime) {
                cameraActive = false;
                lastCameraShow = millis();
            }
        }
        
        if (cameraActive && nearestCoin) {
            // Draw zoomed area around coin to graphics buffer
            zoomGraphics.clear();
            
            // Metallic gradient background
            for(let i = 0; i < zoomGraphics.height; i++) {
                let inter = map(i, 0, zoomGraphics.height, 0, 1);
                let c = lerpColor(color(0, 20, 40), color(0, 40, 80), inter);
                zoomGraphics.stroke(c);
                zoomGraphics.line(0, i, zoomGraphics.width, i);
            }
            
            // Calculate zoom area to include both coin and fish
            let zoomCenterX = nearestCoin.x;
            let zoomCenterY = nearestCoin.y;
            
            // Get zoomed portion around coin
            let zoomedArea = get(
                zoomCenterX - zoomWidth/2,
                zoomCenterY - zoomHeight/2,
                zoomWidth,
                zoomHeight
            );
            
            // Draw to graphics buffer
            zoomGraphics.image(zoomedArea, 20, 20, 
                zoomGraphics.width - 40, 
                zoomGraphics.height - 40
            );
            
            // Draw the coin in the zoom view
            let coinZoomX = map(nearestCoin.x, zoomCenterX - zoomWidth/2, zoomCenterX + zoomWidth/2, 20, zoomGraphics.width - 20);
            let coinZoomY = map(nearestCoin.y, zoomCenterY - zoomHeight/2, zoomCenterY + zoomHeight/2, 20, zoomGraphics.height - 20);
            zoomGraphics.image(coin, coinZoomX - nearestCoin.r/2, coinZoomY - nearestCoin.r/2, nearestCoin.r, nearestCoin.r);
            
            // Draw tech frame
            zoomGraphics.noFill();
            zoomGraphics.strokeWeight(2);
            
            // Outer frame
            zoomGraphics.stroke(0, 210, 255);
            zoomGraphics.rect(10, 10, zoomGraphics.width - 20, zoomGraphics.height - 20);
            
            // Corner accents
            drawCornerAccent(zoomGraphics, 5, 5, 20, 20);
            drawCornerAccent(zoomGraphics, zoomGraphics.width - 25, 5, -20, 20);
            drawCornerAccent(zoomGraphics, 5, zoomGraphics.height - 25, 20, -20);
            drawCornerAccent(zoomGraphics, zoomGraphics.width - 25, zoomGraphics.height - 25, -20, -20);
            
            // Add "LIVE" text
            zoomGraphics.fill(255, 0, 0);
            zoomGraphics.noStroke();
            zoomGraphics.rect(20, 20, 50, 20);
            zoomGraphics.fill(255);
            zoomGraphics.textSize(14);
            zoomGraphics.textAlign(CENTER, CENTER);
            zoomGraphics.text("LIVE", 45, 30);
            
            // Add enhanced HUD elements
            zoomGraphics.push();
            
            // Distance indicator
            // let distance = dist(fish.bbox.x, fish.bbox.y, nearestCoin.x, nearestCoin.y).toFixed(1);
            // zoomGraphics.stroke(0, 200, 10, 300);
            // zoomGraphics.strokeWeight(2);
            
            // Draw connecting line between fish and coin
            // let fishZoomX = map(fish.bbox.x, nearestCoin.x - zoomWidth/2, nearestCoin.x + zoomWidth/2, 20, zoomGraphics.width - 20);
            // let fishZoomY = map(fish.bbox.y, nearestCoin.y - zoomHeight/2, nearestCoin.y + zoomHeight/2, 20, zoomGraphics.height - 20);
            // zoomGraphics.line(coinZoomX, coinZoomY, fishZoomX, fishZoomY);
            
            // Animated scanning effect
            let scanPos = (frameCount % 60) / 60;
            zoomGraphics.stroke(0, 255, 255, 50);
            zoomGraphics.line(20, 20 + scanPos * (zoomGraphics.height - 40), zoomGraphics.width - 20, 20 + scanPos * (zoomGraphics.height - 40));
            
            // HUD Text
            zoomGraphics.textFont(font);
            zoomGraphics.textSize(12);
            zoomGraphics.fill(0, 0, 0);
            zoomGraphics.noStroke();
            
            // Target lock box
            zoomGraphics.noFill();
            zoomGraphics.stroke(255, 0, 0);
            zoomGraphics.strokeWeight(1);
            let boxSize = 30 + sin(frameCount * 0.1) * 5;
            zoomGraphics.rect(coinZoomX - boxSize/2, coinZoomY - boxSize/2, boxSize, boxSize);
            
            // Stats display
            zoomGraphics.fill(255, 255, 255);
            zoomGraphics.noStroke();
            zoomGraphics.textAlign(LEFT);
            
            // Humorous stats

            // zoomGraphics.text(`FISH VELOCITY: ${abs(sin(frameCount * 0.1) * 299792458).toFixed(0)} m/s`, 30, 70);
            // zoomGraphics.text(`DISTANCE: ${distance} in`, 30, 110);
            
            // Targeting brackets
            let bracketSize = 10;
            zoomGraphics.stroke(0, 255, 255);
            // Top left
            zoomGraphics.line(coinZoomX - boxSize/2 - bracketSize, coinZoomY - boxSize/2, coinZoomX - boxSize/2, coinZoomY - boxSize/2);
            zoomGraphics.line(coinZoomX - boxSize/2, coinZoomY - boxSize/2, coinZoomX - boxSize/2, coinZoomY - boxSize/2 + bracketSize);
            // Top right (similar pattern)
            // Bottom brackets (similar pattern)
            
            zoomGraphics.pop();
            
            // Draw the graphics buffer to main canvas
            image(zoomGraphics, 20, 20);
            
            // Draw detection radius around coin (optional, for debugging)
            noFill();
            stroke(0, 255, 255, 50);
            circle(nearestCoin.x, nearestCoin.y, detectionRadius * 2);
        }
    }
}

function draw() {
    clear();
    image(vid, 0, 0);
    
    initialized_model.then(function (model) {
        model.detect(vid.elt).then(function (predictions) {
            objects = predictions;
        })
    });

    // Detect Collisions
    for (let i = 0; i < objects.length; i++) {
        // Draw background for nametag
        fill(0, 0, 0, 180); // Semi-transparent black background
        rect(objects[i].bbox.x - objects[i].bbox.width / 2 - 5, 
             objects[i].bbox.y - objects[i].bbox.height / 2 - 25, 
             textWidth(objects[i].class) + 10, 
             20, 
             3); // Rounded rectangle

        // Draw border
        stroke(0, 210, 255); // Cyan border color
        strokeWeight(1);
        rect(objects[i].bbox.x - objects[i].bbox.width / 2 - 5,
             objects[i].bbox.y - objects[i].bbox.height / 2 - 25,
             textWidth(objects[i].class) + 10,
             20,
             3);

        // Draw text
        fill(0, 210, 255); // Cyan text color
        noStroke();
        textSize(14);
        textAlign(CENTER);
        text(objects[i].class.toUpperCase(),
             objects[i].bbox.x - objects[i].bbox.width / 2 + textWidth(objects[i].class)/2,
             objects[i].bbox.y - objects[i].bbox.height / 2 - 12);

        coins.forEach(coin => {
            if (checkCollision(objects[i].bbox, coin)) {
                coin.collectCoin();
                let newCoin = new coinClass(random(0, width), random(0, height), 50);
                coins.push(newCoin);
                winner = get(objects[i].bbox.x - objects[i].bbox.width / 2, objects[i].bbox.y - objects[i].bbox.height / 2, objects[i].bbox.width, objects[i].bbox.height);
                showHat = random(0, 1) < 0.2; // random chance of hat
                !showWinner && playerSpotlight(winner, showHat);
                showWinner = true;
            }
        })
    }

    if (showWinner && mvpPic && objects[0]) {
        if (showHat) {
            // show cowboy hat on winner
            image(hat, objects[0].bbox.x - objects[0].bbox.width / 2, objects[0].bbox.y - objects[0].bbox.height/2, objects[0].bbox.width/2, objects[0].bbox.height/2);
        }
            winner = get(objects[0].bbox.x - objects[0].bbox.width / 2, objects[0].bbox.y - objects[0].bbox.height / 2, objects[0].bbox.width, objects[0].bbox.height);
            mvpPic.src = winner.canvas.toDataURL();
        }
        
        drawZoomFrame();

    coins.forEach(coin => {
        coin.show();
    })
}

function playerSpotlight(pic, showHat) {
    const div = document.createElement("div");
    div.classList.add("playerSpotlightContainer");
    
    // Create and add the image
    mvpPic = createImg(pic.canvas.toDataURL(), "player");
    mvpPic.elt.id = "playerSpotlight";
    div.appendChild(mvpPic.elt);

    // Create stats container but don't show yet
    const stats = document.createElement("article");
    stats.id = "testStats";
    stats.innerHTML = `
        <h1>Tang</h1>
        <p><b>Age</b><span>Unknown</span></p>
        <p><b>Species</b><span>Zebrasoma flavescens</span></p>
        <p><b>Coin per game</b><span>3.24</span></p>
        <p><b>Rank</b><span>#2</span></p>
    `;
    div.appendChild(stats);

    const main = document.querySelector("main");
    main.appendChild(div);

    if (showHat) { 
        cottoneye.play();
    } else {
        mvpSong.play();
    }

    // Animation sequence
    setTimeout(() => {
        div.classList.add("centerHighlight");
    }, 100);

    // Show stats after initial animation
    setTimeout(() => {
        stats.classList.add("show");
        // Animate each stat line sequentially
        const statLines = stats.querySelectorAll('p');
        statLines.forEach((line, index) => {
            setTimeout(() => {
                line.classList.add('show');
            }, index * 200);
        });
    }, 1500);

    // Close animation
    setTimeout(() => {
        div.classList.add("close");
        showWinner = false;
        setTimeout(() => {
            div.remove();
        }, 1000);
    }, 6000);
}

class coinClass {
    constructor(x, y, r, img) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.coin = coin;
        this.hitbox = true;
    }

    collectCoin() {
        this.hitbox = false;
        coinFX.play();
        this.r = .1;
        this.x += 10;
        this.y += 10;
    }

    move() {
        this.x = this.x + random(-2, 2);
        this.y = this.y + random(-2, 2);
    }

    show() {
        image(this.coin, this.x, this.y, this.r, this.r);
    }
}


function checkCollision(rect, circle) {
    if (!circle.hitbox) {
        return false;
    }
    let hit = collideRectCircle(rect.x - rect.width / 2, rect.y - rect.height / 2, rect.width, rect.height, circle.x, circle.y, circle.r)
    return hit
}

// Helper function to draw corner accents
function drawCornerAccent(g, x, y, w, h) {
    g.stroke(0, 210, 255);
    g.strokeWeight(3);
    g.line(x, y, x + w, y);
    g.line(x, y, x, y + h);
}