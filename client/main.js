import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Scene } from "./scene.js"

const socket = new WebSocket("ws://localhost:8080/ws")

socket.addEventListener("open", function (event) {
	console.log("Connected to WebSocket server")
})

var circles = []

socket.addEventListener("message", function (event) {
	circles = JSON.parse(event.data)
	step()
	// You can handle the incoming message here
})

const scene = new Scene("threejs-container")
scene.startAnimationLoop()

// ADD HOUSE BUTTON
document.getElementById("addHouse").addEventListener("click", () => {
    scene.isBuilding = true;
    scene.currentBuildingType = "house";
});
// ADD TOWN HALL BUTTON
document.getElementById("addTownHall").addEventListener("click", () => {
    scene.isBuilding = true;
    scene.currentBuildingType = "townhall";
})

// Handle resizing
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
});

window.addEventListener("mousemove", (event) => {
    scene.mouseX = (event.clientX / window.innerWidth)*2 - 1;
    scene.mouseY = -(event.clientY / window.innerHeight)*2 + 1;
});

window.addEventListener('keydown', (event) => {
    scene.keysPressed[event.key] = true;
});

window.addEventListener('keyup', (event) => {
    scene.keysPressed[event.key] = false;
});


document.getElementById('threejs-container').addEventListener('mousedown', (event) => {
    const mouseX = (event.clientX / window.innerWidth)*2 - 1;
    const mouseY = -(event.clientY / window.innerHeight)*2 + 1;
    scene.handleClick(event.button, mouseX, mouseY);
});