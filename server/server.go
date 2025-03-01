package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var cubes = []struct {
	X int     `json:"x"`
	Y int     `json:"y"`
	L float32 `json:"l"`
}{
	{X: 10, Y: 10, L: 1},
	{X: 5, Y: 5, L: 1},
	{X: 3, Y: 3, L: 2},
	{X: 8, Y: 0, L: 50},
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatalf("Failed to upgrade to websocket: %v", err)
	}
	defer ws.Close()

	for {
		time.Sleep(100 * time.Millisecond)
		circleJSON, err := json.Marshal(cubes)
		if err != nil {
			log.Printf("Error marshalling JSON: %v", err)
			break
		}
		err = ws.WriteMessage(websocket.TextMessage, circleJSON)
		if err != nil {
			log.Printf("Error writing message: %v", err)
			break
		}
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)

	log.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}