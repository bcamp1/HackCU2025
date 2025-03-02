import * as THREE from "three"

// todo: change color based on player

class Unit {
	constructor(id, height, color) {
		this.id = id
		this.height = height
		const geometry = new THREE.BoxGeometry(height, height, height)
		const material = new THREE.MeshBasicMaterial({ color: color })
		const cube = new THREE.Mesh(geometry, material)
		this.meshId = cube.id
		cube.castShadow = true
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
	constructor(id) {
		super(id, 0.5, 0x39e7ed)
	}
}

export class Builder extends Unit {
	constructor(id) {
		super(id, 0.25, 0x1167ad)
	}
}
