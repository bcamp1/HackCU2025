import { Scene } from "./scene.js"

const socket = new WebSocket("ws://localhost:8080/ws")

socket.addEventListener("open", function (event) {
	console.log("Connected to WebSocket server")
})

var troops = []
var commandBuffer = []

const scene = new Scene("threejs-container")

socket.addEventListener("message", function (event) {
	troops = JSON.parse(event.data)

	if (commandBuffer.length > 0) {
		console.log("Sending message buffer", commandBuffer)
		socket.send(JSON.stringify(commandBuffer))
		commandBuffer = []
	} else {
		socket.send(JSON.stringify([{ noop: true }]))
	}

	step()
	// You can handle the incoming message here
})

function step() {
	Object.entries(troops).forEach((value, _) => {
		const troop = value[1]
		const id = value[0]
		if (!Object.keys(scene.troops).includes(troop.player)) {
			scene.troops[troop.player] = {}
		}
		if (scene.troops[troop.player][id] === undefined) {
			scene.addFighter(
				id,
				troop.player,
				"knight",
				troop.pos.x,
				troop.pos.y,
				troop.pos.z
			)
		} else {
			scene.addFighter(
				id,
				troop.player,
				"knight",
				troop.pos.x,
				troop.pos.y,
				troop.pos.z
			)
		}
	})
}

scene.startAnimationLoop()

// UI interaction: Rotate the cube when the button is clicked
// ADD HOUSE BUTTON
document.getElementById("addHouse").addEventListener("click", () => {
	scene.isBuilding = true
	scene.currentBuildingType = "house"
})
// ADD TOWN HALL BUTTON
document.getElementById("addTownHall").addEventListener("click", () => {
	scene.isBuilding = true
	scene.currentBuildingType = "townhall"
})

// Handle resizing
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
})

window.addEventListener("mousemove", (event) => {
	scene.mouseX = (event.clientX / window.innerWidth) * 2 - 1
	scene.mouseY = -(event.clientY / window.innerHeight) * 2 + 1
})

window.addEventListener("keydown", (event) => {
	scene.keysPressed[event.key] = true
})

window.addEventListener("keyup", (event) => {
	scene.keysPressed[event.key] = false
})

window.addEventListener("contextmenu", (event) => {
	event.preventDefault()
})
