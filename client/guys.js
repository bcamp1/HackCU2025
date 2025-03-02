import * as THREE from "three"

const p1BuilderColor = 0x307c91
const p2BuilderColor = 0xb83232
const p1KnightColor = 0x2c3e91
const p2KnightColor = 0x800000

class Unit {
	constructor(id, height, color) {
		this.id = id
		this.height = height
		const geometry = new THREE.BoxGeometry(height, height, height)
		const material = new THREE.MeshBasicMaterial({ color: color })
		const cube = new THREE.Mesh(geometry, material)
		this.meshId = cube.id
		cube.castShadow = true
		cube.color = color
		const edges = new THREE.EdgesGeometry(cube.geometry)
		const lineMaterial = new THREE.LineBasicMaterial({
			color: 0x000000,
			linewidth: 5,
		})
		const outline = new THREE.LineSegments(edges, lineMaterial)
		cube.add(outline)
		this.mesh = cube
	}
}

export class Knight extends Unit {
	constructor(id, playerId) {
		if (playerId == 1) {
			super(id, 0.5, p1KnightColor)
		}
		if (playerId == 2) {
			super(id, 0.5, p2KnightColor)
		}
	}
}

export class Builder extends Unit {
	constructor(id, playerId) {
		if (playerId == 1) {
			super(id, 0.25, p1BuilderColor)
		}
		if (playerId == 2) {
			super(id, 0.25, p2BuilderColor)
		}
	}
}
