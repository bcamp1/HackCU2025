package main

import (
	"encoding/json"
	"log"
	"math"
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
	X float64     `json:"x"`
	Y float64     `json:"y"`
	Z float64    `json:"z"`
	L float64 `json:"l"`
}{
	{X: 1, Y: 1,Z: 1, L: 1},
	{X: 3, Y: 1,Z: 1, L: 1},
	{X: -1, Y: 1,Z: 3, L: 1},
	{X: 2, Y: 1,Z: 0, L: 1},
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatalf("Failed to upgrade to websocket: %v", err)
	}
	defer ws.Close()

	for {
		time.Sleep(10 * time.Millisecond)
		for i := range cubes {
			cubes[i].X = math.Sin(float64(time.Now().UnixNano() )* 0.000000001 )
		}
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