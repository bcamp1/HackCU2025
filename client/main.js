import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Scene } from "./scene.js"

const socket = new WebSocket("ws://localhost:8080/ws")

socket.addEventListener("open", function (event) {
	console.log("Connected to WebSocket server")
})

const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
cube.position.set(0, 1, 0);
scene.add( cube );


const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xAAAAAA, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
scene.add(plane);

camera.position.set(0, 5, 11);
// Make sure the camera looks towards the origin (where the plane is centered)
camera.lookAt(new THREE.Vector3(0, 0, 0));
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
