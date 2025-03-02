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
		if (scene.troops[troop.player][id] === undefined) {
			scene.addTroop(id, troop.player, troop.pos.x, troop.pos.y, troop.pos.z)
		} else {
			scene.moveTroop(id, troop.player, troop.pos.x, troop.pos.y, troop.pos.z)
		}
	})
}

scene.startAnimationLoop()

// UI interaction: Rotate the cube when the button is clicked
document.getElementById("rotateButton").addEventListener("click", () => {
	commandBuffer.push({ moveTroop: { id: 1, pos: { x: 1, y: 1, z: 1 } } })
})

// Handle resizing
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
})

window.addEventListener("click", (event) => {
	event.preventDefault()
	console.log("click")
})
