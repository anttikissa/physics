const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Canvas dimensions
const WIDTH = 800;
const HEIGHT = 600;
canvas.width = WIDTH;
canvas.height = HEIGHT;

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
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Clear and set initial background
setBackground('#f0f0f0');

// Example: draw a ball at the origin
ball(0, 0, 10);
