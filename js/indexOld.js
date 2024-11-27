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

function preload() {
    coin = loadImage('./assets/coin.png');
    hat = loadImage('./assets/hat.png');
    coinFX = loadSound('assets/coin.wav');
    mvpSong = loadSound('assets/mvpSong.wav');
    cottoneye = loadSound('assets/cottoneye.wav');
}

let coins = []

function setup() {
    createCanvas(1280, 720);
    vid = createVideo('./assets/aquarium.mp4');
    vid.hide();
    vid.loop();
    // testCoin = new coinClass(1000, 100, 50);
    // coins.push(testCoin);
    
    // Create graphics buffer for zoom frame
    zoomGraphics = createGraphics(400, 250);
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
      // Draw zoom frame if there's a detected fish
      if (objects[0]) {
        const fish = objects[0];
        
        // Draw zoomed fish to graphics buffer
        zoomGraphics.clear();
        
        // Metallic gradient background
        for(let i = 0; i < zoomGraphics.height; i++) {
            let inter = map(i, 0, zoomGraphics.height, 0, 1);
            let c = lerpColor(color(0, 20, 40), color(0, 40, 80), inter);
            zoomGraphics.stroke(c);
            zoomGraphics.line(0, i, zoomGraphics.width, i);
        }
        
        // Get zoomed portion of fish
        let zoomedFish = get(
            fish.bbox.x - fish.bbox.width/2 - 20, 
            fish.bbox.y - fish.bbox.height/2 - 20, 
            fish.bbox.width + 40, 
            fish.bbox.height + 40
        );
        
        // Draw to graphics buffer
        zoomGraphics.image(zoomedFish, 20, 20, 
            zoomGraphics.width - 40, 
            zoomGraphics.height - 40
        );
        
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
        
        // Draw the graphics buffer to main canvas
        image(zoomGraphics, 20, 20);
    }
}

function draw() {
    // background(222);
    clear()
    image(vid, 0, 0);
    // image(vid, 0, 0, width, height, zoomX, zoomY, zoomWidth, zoomHeight);
    initialized_model.then(function (model) {
        /// use model.detect() to make a prediction
        model.detect(vid.elt).then(function (predictions) {
            objects = predictions;
        })
    });

    // Detect Collisions
    for (let i = 0; i < objects.length; i++) {
        noStroke();
        fill(255);
        textSize(40);
        text(objects[i].class, objects[i].bbox.x - objects[i].bbox.width / 2, objects[i].bbox.y - objects[i].bbox.height / 2);

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
        image(winner, 0, 0);
        if (showHat) {
                        // show cowboy hat on winner
            image(hat, objects[0].bbox.x - objects[0].bbox.width / 2, objects[0].bbox.y - objects[0].bbox.height/2, objects[0].bbox.width/2, objects[0].bbox.height/2);
        } else {
            image(winner, 0, 0);
        }
            winner = get(objects[0].bbox.x - objects[0].bbox.width / 2, objects[0].bbox.y - objects[0].bbox.height / 2, objects[0].bbox.width, objects[0].bbox.height);
            mvpPic.src = winner.canvas.toDataURL();
        }
        // image(winner, 0, 0, winner.width * 2, winner.height * 2);
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