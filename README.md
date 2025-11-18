# Physics

A canvas-based physics experiment project.

**Live Demo:** https://anttikissa.github.io/physics/

## About This Project

This project is built entirely using **Claude Code on the web** - no local development environment required.

### Development Approach

- All code is written through Claude Code web interface
- Every user prompt is logged to [PROMPTS.txt](PROMPTS.txt) with the commit hash for full transparency
- The project uses a simple coordinate system (-100 to 100 on both axes) for easy physics calculations

### Project Structure

- `index.html` - Main HTML page with canvas setup
- `main.js` - JavaScript with canvas rendering and coordinate system
- `PROMPTS.txt` - Log of all prompts used to build this project
- `CLAUDE.md` - Instructions for Claude Code

## Features

- Responsive canvas that works on mobile and desktop
- Custom coordinate system centered at origin
- Helper function `ball(x, y, radius)` for drawing circles
