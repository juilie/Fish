# FishCentreAI - Interactive Fish Detection Game

## Overview
FishCentreAI is an interactive web application that uses machine learning to detect and track fish in real-time video. Built with p5.js and the Roboflow API, it gamifies fish detection by creating an engaging experience where fish can collect coins and earn achievements.

![Project Screenshot Placeholder]

## Key Features
- Real-time fish detection and tracking using machine learning
- Interactive coin collection gameplay
- Dynamic zoom lens that follows fish near coins
- Celebratory animations and sound effects
- Stats tracking and player highlights
- Retro-futuristic UI design with dynamic animations

## Technologies Used
- JavaScript/ES6+
- p5.js for creative coding and animations
- Roboflow API for machine learning-based object detection
- HTML5/CSS3
- Custom dataset trained on fish species

## Technical Highlights

### Machine Learning Integration
The project uses a custom-trained model via Roboflow to detect multiple fish species:

```javascript
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
```

## Performance Optimizations
- Debounced camera tracking for smoother performance
- Efficient collision detection algorithms
- Optimized graphics rendering using p5.js
- Asynchronous model loading

## Development Highlights
- Implemented custom animation system for smooth transitions
- Integrated real-time video processing
- Developed custom fish detection model
- Created custom dataset for training the model

## Future Enhancements
- Add more game modes
- Track fish stats across multiple games
- Improve dataset for more accurate detection
- Find a tank that can be used for the game as a live feed
- Live AI narration of the game