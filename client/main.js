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

function step() {
	scene.rotateCube(0.5, 0.5)
}

const scene = new Scene("threejs-container")
scene.startAnimationLoop()

// UI interaction: Rotate the cube when the button is clicked
document.getElementById("rotateButton").addEventListener("click", () => {
	scene.rotateCube(0.5, 0.5)
})

// Handle resizing
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
})
