const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Canvas dimensions (will be updated on resize)
let WIDTH = 800;
let HEIGHT = 600;
const ASPECT_RATIO = 4 / 3; // 800:600
const MARGIN = 10;

// Resize canvas to fit viewport with margins
function resizeCanvas() {
    const maxWidth = window.innerWidth - (MARGIN * 2);
    const maxHeight = window.innerHeight - (MARGIN * 2);

    // Calculate dimensions maintaining aspect ratio
    let newWidth = maxWidth;
    let newHeight = newWidth / ASPECT_RATIO;

    // If height exceeds available space, constrain by height instead
    if (newHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = newHeight * ASPECT_RATIO;
    }

    WIDTH = Math.floor(newWidth);
    HEIGHT = Math.floor(newHeight);
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
}

// Initialize canvas size
resizeCanvas();

// Handle window resize
window.addEventListener('resize', resizeCanvas);

// Coordinate system: -100 to 100 for both x and y
const COORD_RANGE = 100;

// Convert from coordinate system to canvas pixels
function toCanvasX(x) {
    return (x + COORD_RANGE) / (2 * COORD_RANGE) * WIDTH;
}

function toCanvasY(y) {
    // Flip y-axis so positive is up
    return (COORD_RANGE - y) / (2 * COORD_RANGE) * HEIGHT;
}

function toCanvasRadius(r) {
    // Scale radius based on canvas size
    return r / (2 * COORD_RANGE) * Math.min(WIDTH, HEIGHT);
}

// Convert from canvas pixels to coordinate system
function fromCanvasX(canvasX) {
    return (canvasX / WIDTH) * (2 * COORD_RANGE) - COORD_RANGE;
}

function fromCanvasY(canvasY) {
    // Flip y-axis so positive is up
    return COORD_RANGE - (canvasY / HEIGHT) * (2 * COORD_RANGE);
}

// Set canvas background color
function setBackground(color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

// Draw a ball at (x, y) with given radius
// Black outline on white background
function ball(x, y, radius) {
    const cx = toCanvasX(x);
    const cy = toCanvasY(y);
    const r = toCanvasRadius(radius);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Physics constants
const FPS = 60;
const DT = 1 / FPS; // Time step in seconds
// Gravity: ball at (0, 80) should fall to (0, -100) in ~1 second
// Distance = 180 units, using d = 0.5 * g * t², g = 360 units/s²
const GRAVITY = 360;

// Physics objects array
const objects = [];

// Create a physics ball object
function createBall(x, y, radius, vx = 0, vy = 0) {
    const obj = { x, y, radius, vx, vy };
    objects.push(obj);
    return obj;
}

// Apply gravity to all objects
function applyGravity() {
    for (const obj of objects) {
        obj.vy -= GRAVITY * DT;
    }
}

// Move all objects: update positions based on velocities
function moveObjects() {
    for (const obj of objects) {
        obj.x += obj.vx * DT;
        obj.y += obj.vy * DT;
    }
}

// Handle collisions with walls/boundaries
function collideWalls() {
    for (const obj of objects) {
        let collided = false;

        // Floor collision (y = -100)
        if (obj.y - obj.radius < -COORD_RANGE) {
            obj.y = -COORD_RANGE + obj.radius;
            obj.vy = -obj.vy;
            collided = true;
        }

        // Ceiling collision (y = 100)
        if (obj.y + obj.radius > COORD_RANGE) {
            obj.y = COORD_RANGE - obj.radius;
            obj.vy = -obj.vy;
            collided = true;
        }

        // Left wall collision (x = -100)
        if (obj.x - obj.radius < -COORD_RANGE) {
            obj.x = -COORD_RANGE + obj.radius;
            obj.vx = -obj.vx;
            collided = true;
        }

        // Right wall collision (x = 100)
        if (obj.x + obj.radius > COORD_RANGE) {
            obj.x = COORD_RANGE - obj.radius;
            obj.vx = -obj.vx;
            collided = true;
        }

        // Reduce velocity by 10% on collision
        if (collided) {
            obj.vx *= 0.9;
            obj.vy *= 0.9;
        }
    }
}

// Handle ball-to-ball collisions
function collideObjects() {
    for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
            const a = objects[i];
            const b = objects[j];

            // Vector from a to b
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = a.radius + b.radius;

            // Check for collision
            if (dist < minDist && dist > 0) {
                // Normalize the collision vector
                const nx = dx / dist;
                const ny = dy / dist;

                // Calculate overlap and displace balls equally
                const overlap = minDist - dist;
                const halfOverlap = overlap / 2;

                // Move balls apart
                a.x -= nx * halfOverlap;
                a.y -= ny * halfOverlap;
                b.x += nx * halfOverlap;
                b.y += ny * halfOverlap;

                // Calculate relative velocity along collision normal
                const relVelX = b.vx - a.vx;
                const relVelY = b.vy - a.vy;
                const relVelAlongNormal = relVelX * nx + relVelY * ny;

                // Only apply collision response if balls are approaching
                if (relVelAlongNormal < 0) {
                    // For equal mass elastic collision, exchange velocity components along normal
                    // Apply restitution (0.9) for some energy loss
                    const restitution = 0.9;
                    const impulse = -(1 + restitution) * relVelAlongNormal / 2;

                    a.vx -= impulse * nx;
                    a.vy -= impulse * ny;
                    b.vx += impulse * nx;
                    b.vy += impulse * ny;
                }
            }
        }
    }
}

// Update physics for all objects
function updatePhysics() {
    applyGravity();
    moveObjects();
    collideWalls();
    collideObjects();
}

// Draw all objects
function draw() {
    setBackground('#f0f0f0');

    for (const obj of objects) {
        ball(obj.x, obj.y, obj.radius);
    }
}

// Main game loop
let lastTime = 0;
let accumulator = 0;

function gameLoop(currentTime) {
    if (lastTime === 0) {
        lastTime = currentTime;
    }

    const frameTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    accumulator += frameTime;

    // Fixed timestep physics updates
    while (accumulator >= DT) {
        updatePhysics();
        accumulator -= DT;
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// Ball at (90, -90) and one 50 units above
createBall(90, -90, 10);
createBall(90, -40, 10);

// Two balls at x: 40 and x: 60, and one above them at (50, -30)
createBall(40, -80, 10);
createBall(60, -80, 10);
createBall(50, -30, 10);

// Find ball at given coordinates, returns index or -1 if not found
function findBallAt(x, y) {
    for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        const dx = x - obj.x;
        const dy = y - obj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= obj.radius) {
            return i;
        }
    }
    return -1;
}

// Explode a ball: remove it and add impact velocity to nearby balls
function explodeBall(index) {
    const exploding = objects[index];
    const EXPLOSION_RADIUS = 50; // Range of explosion effect
    const EXPLOSION_STRENGTH = 200; // Base velocity to add

    // Apply impact to nearby balls
    for (let i = 0; i < objects.length; i++) {
        if (i === index) continue;

        const obj = objects[i];
        const dx = obj.x - exploding.x;
        const dy = obj.y - exploding.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < EXPLOSION_RADIUS && dist > 0) {
            // Normalize direction
            const nx = dx / dist;
            const ny = dy / dist;

            // Impact falls off with distance
            const impact = EXPLOSION_STRENGTH * (1 - dist / EXPLOSION_RADIUS);

            obj.vx += nx * impact;
            obj.vy += ny * impact;
        }
    }

    // Remove the exploding ball
    objects.splice(index, 1);
}

// Handle canvas clicks/taps to create balls
let pointerX = 0;
let pointerY = 0;
let holdTimeout = null;
let repeatInterval = null;

function createBallAtPointer() {
    const x = fromCanvasX(pointerX);
    const y = fromCanvasY(pointerY);

    // Random velocities: vx -50 to 50, vy -20 to 40
    const vx = Math.random() * 100 - 50;
    const vy = Math.random() * 60 - 20;

    // Random radius from 4 to 15
    const radius = Math.random() * 11 + 4;
    createBall(x, y, radius, vx, vy);
}

function startPointer(canvasX, canvasY) {
    pointerX = canvasX;
    pointerY = canvasY;

    // Check if clicking on an existing ball
    const x = fromCanvasX(canvasX);
    const y = fromCanvasY(canvasY);
    const ballIndex = findBallAt(x, y);

    if (ballIndex !== -1) {
        // Explode the ball
        explodeBall(ballIndex);
        return;
    }

    // Create first ball immediately
    createBallAtPointer();

    // After 0.3s, start repeating at 10/sec
    holdTimeout = setTimeout(() => {
        repeatInterval = setInterval(createBallAtPointer, 100);
    }, 300);
}

function stopPointer() {
    if (holdTimeout) {
        clearTimeout(holdTimeout);
        holdTimeout = null;
    }
    if (repeatInterval) {
        clearInterval(repeatInterval);
        repeatInterval = null;
    }
}

// Mouse events
canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    startPointer(event.clientX - rect.left, event.clientY - rect.top);
});

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointerX = event.clientX - rect.left;
    pointerY = event.clientY - rect.top;
});

canvas.addEventListener('mouseup', stopPointer);
canvas.addEventListener('mouseleave', stopPointer);

// Touch events
canvas.addEventListener('touchstart', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    startPointer(touch.clientX - rect.left, touch.clientY - rect.top);
});

canvas.addEventListener('touchmove', (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    pointerX = touch.clientX - rect.left;
    pointerY = touch.clientY - rect.top;
});

canvas.addEventListener('touchend', (event) => {
    event.preventDefault();
    stopPointer();
});

canvas.addEventListener('touchcancel', stopPointer);

// Start the game loop
requestAnimationFrame(gameLoop);
