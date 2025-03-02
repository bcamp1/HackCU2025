import * as THREE from "three"
export class Knight {
	constructor(id) {
		this.id = id
		const geometry = new THREE.BoxGeometry(1, 1, 1)
		const material = new THREE.MeshBasicMaterial({ color: 0x1167ad })
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
