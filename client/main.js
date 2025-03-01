import * as THREE from "three"

const socket = new WebSocket("ws://localhost:8080/ws")

socket.addEventListener("open", function (event) {
	console.log("Connected to WebSocket server")
})

socket.addEventListener("message", function (event) {
	console.log("Message from server:", event.data)
	// You can handle the incoming message here
})

const container = document.getElementById("threejs-container")
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
)

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
container.appendChild(renderer.domElement)

const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
const cube = new THREE.Mesh(geometry, material)
scene.add(cube)

camera.position.z = 5

function animate() {
	renderer.render(scene, camera)
}
renderer.setAnimationLoop(animate)

// UI interaction: Rotate the cube when the button is clicked
document.getElementById("rotateButton").addEventListener("click", () => {
	cube.rotation.x += 0.5
	cube.rotation.y += 0.5
})

// Handle resizing
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
})
