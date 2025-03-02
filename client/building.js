import * as THREE from "three"

export class Building {
    /*
    Stores:
    - type ["house", "townhall", ""]
    - health [0-100]
    - mesh
    - width
    - height
    */
    constructor(type, x, y, z) {
        this.type = type;
        this.health = 100;

        // Construct mesh
        if(this.type == "house") {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshLambertMaterial({ color: 0x003388, shadowSide: THREE.DoubleSide });
            this.mesh = new THREE.Mesh(geometry, material);
            this.offset = new THREE.Vector3(0.5, 0.5, 0.5);
            this.mesh.position.set(x + this.offset.x, y + this.offset.y, z + this.offset.z);
            this.mesh.castShadow = true;
            const edges = new THREE.EdgesGeometry(this.mesh.geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
            const outline = new THREE.LineSegments(edges, lineMaterial);
            this.mesh.add(outline);

            this.width = 1;
            this.height = 1;
        } else if(this.type = "townhall") {
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshLambertMaterial({ color: 0x003388, shadowSide: THREE.DoubleSide });
            this.mesh = new THREE.Mesh(geometry, material);
            this.offset = new THREE.Vector3(1, 1, 1);
            this.mesh.position.set(x + this.offset.x, y + this.offset.y, z + this.offset.z);
            this.mesh.castShadow = true;
            const edges = new THREE.EdgesGeometry(this.mesh.geometry);
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
            const outline = new THREE.LineSegments(edges, lineMaterial);
            this.mesh.add(outline);

            this.width = 2;
            this.height = 2;
        }
    }

    moveTo(position) {
        this.mesh.position.set(position.x + this.offset.x, position.y + this.offset.y, position.z + this.offset.z);
    }

    changeHealth(amount) {
        if(this.health + amount > 0) {
            this.health += amount;
            return true;
        } else {
            return false;
        }
    }
}