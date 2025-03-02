package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var game Game
var connections = make(map[*websocket.Conn]PlayerID)
var connMutex sync.Mutex

type MoveTroopCommand struct {
	ID  int    `json:"id"`
	POS Float3 `json:"pos"`
}

type PlaceBuildingCommand struct {
	TYPE string `json:"type"`
	POS  Float3 `json:"pos"`
}

type AttackCommand struct {
	TARGET_ID   int `json:"target_id"`
	ATTACKER_ID int `json:"attacker_id"`
}

var commands = map[string]func(map[string]any, PlayerID){
	"moveUnit": func(command map[string]any, playerID PlayerID) {
		pos := mapToFloat3(command["pos"].(map[string]any))
		id := EntityID(int(command["id"].(float64)))
		unit := game.getMovable(id)
		if unit != nil {
			unit.SetGoalPosition(pos)
		}
	},

	"placeHouse": func(command map[string]any, playerID PlayerID) {
		pos := mapToGridLocation(command["pos"].(map[string]any))
		game.createHouse(pos, playerID)
	},

	"createKnight": func(command map[string]any, playerID PlayerID) {
		pos := mapToFloat3(command["pos"].(map[string]any))
		game.createKnight(pos, playerID)
	},

	"createBuilder": func(command map[string]any, playerID PlayerID) {
		pos := mapToFloat3(command["pos"].(map[string]any))
		game.createBuilder(pos, playerID)
	},

	"placeTownHall": func(command map[string]any, playerID PlayerID) {
		pos := mapToGridLocation(command["pos"].(map[string]any))
		game.createTownHall(pos, playerID)
	},

	"attack": func(command map[string]any, playerID PlayerID) {
		log.Printf("Attack command")
	},
}

func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatalf("Failed to upgrade to websocket: %v", err)
	}
	defer ws.Close()

	connMutex.Lock()
	playerID := PlayerID(len(connections) + 1)
	log.Printf("Player %v connected", playerID)
	connections[ws] = playerID

	// Send player ID to the client
	idMessage := map[string]any{"playerId": playerID}
	idEncoded, err := json.Marshal(idMessage)
	if err != nil {
		log.Printf("Error marshalling JSON: %v", err)
		return
	}

	err = ws.WriteMessage(websocket.TextMessage, idEncoded)

	connMutex.Unlock()
	if err != nil {
		log.Printf("Error sending player ID: %v", err)
		connMutex.Lock()
		delete(connections, ws)
		connMutex.Unlock()
		return
	}

	for {
		var msgTemp []map[string]any
		err = ws.ReadJSON(&msgTemp)
		if err != nil {
			log.Printf("Error reading message: %v", err)
			connMutex.Lock()
			delete(connections, ws)
			connMutex.Unlock()
			break
		} else {
			if msgTemp[0]["noop"] != true {
				for i := range msgTemp {
					for key := range msgTemp[i] {
						if cmd, ok := msgTemp[i][key].(map[string]any); ok {
							commands[key](cmd, playerID)
						} else {
							log.Printf("Invalid command format: %v", msgTemp[i][key])
						}
					}
				}
			}
		}
	}
}

func broadcastGameState() {
	for {
		time.Sleep(10 * time.Millisecond)
		game.update(0.05)
		gameState := game.GetState()
		gameStateEncoded, err := json.Marshal(gameState)
		if err != nil {
			log.Printf("Error marshalling JSON: %v", err)
			continue
		}

		connMutex.Lock()
		for conn := range connections {
			err := conn.WriteMessage(websocket.TextMessage, gameStateEncoded)
			if err != nil {
				log.Printf("Error writing message: %v", err)
				conn.Close()
				delete(connections, conn)
			}
		}
		connMutex.Unlock()
	}
}

func main() {
	http.HandleFunc("/ws", handleConnections)

	game = MakeTwoPlayerGame()
	game.createKnight(Float3{1, .25, 1}, 1)
	game.createKnight(Float3{2, .25, 1}, 1)
	game.createKnight(Float3{4, .25, 0}, 1)
	game.createKnight(Float3{1, .25, -1}, 1)
	game.createBuilder(Float3{0, .25, 0}, 1)
	game.createBuilder(Float3{0, .25, 1}, 1)
	game.createBuilder(Float3{0, .25, -1}, 1)
	go broadcastGameState()

	log.Println("Server started on :8080")
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}