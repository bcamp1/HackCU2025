package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var gameNumber = 0 
var startPort = 8080
var sgl sync.Mutex



type Game struct {
	Id 	int	
	Players []Player	
} 

type Player struct {
	Number int
	Name string
}

type IpAddress string
type PortNumber int 
type GameCode string

type GamePlayerPair struct {
	game *Game
	player *Player
	ipws *IpWsPair
}

type IpWsPair struct {
	Ip IpAddress
	Ws *websocket.Conn
	Name string
}

func (gp GamePlayerPair) sendMessage(messageType string, data interface{}) {
	if gp.ipws.Ws == nil {
		log.Printf("WebSocket connection is nil for IP: %v", gp.ipws.Ip)
		return
	}
	messageMap := map[string]interface{}{
		"messageType": messageType,
		"data":        data,
	}
	err := gp.ipws.Ws.WriteJSON(messageMap)
	if err != nil {
		log.Printf("Error sending message: %v", err)
	}
}

var Lobbies =  make(map[GameCode][]IpWsPair)

var GameConnections = make(map[IpAddress]GamePlayerPair)   

var GameList = make(map[PortNumber]*Game)

// func broadcastGameState() {
	
// }

func initGame()*Game {
	game := &Game{}
	game.Players = make([]Player, 0)
	return game
}

func (g *Game)createPlayer(name string) *Player{
	player := Player{len(g.Players), name}
	g.Players = append(g.Players, player)
	return &player
}

func handlePlayerConnection(portNumber PortNumber) http.HandlerFunc{
	return func(w http.ResponseWriter, r *http.Request) {
		ws, err := upgrader.Upgrade(w, r, nil)

		if err != nil {
			log.Fatalf("Failed to upgrade to websocket: %v", err)
		}

		ip := IpAddress(strings.Split(ws.RemoteAddr().String(), ":")[0])

		defer ws.Close()
		var player *Player

		sgl.Lock()

		gpPair, exists := GameConnections[ip]
		log.Printf("GameConnections: %v", GameConnections)


		if !exists {
			log.Printf("No existing connection found for IP: %v", ip)
			ws.Close()
			sgl.Unlock()
			return
		}else{
			player = gpPair.player
			gpPair.ipws.Ws = ws
		}



		sgl.Unlock()

		playerNumber := map[string]int{"playerNumber": player.Number}	
		gpPair.sendMessage("playerNumber", playerNumber)
	}
}

func startGame(portNumber PortNumber) {
	game := initGame()
	GameList[portNumber] = game

	slashPort := fmt.Sprintf("/%v", portNumber)
	http.HandleFunc(slashPort, handlePlayerConnection(portNumber))
}

func buildHeader(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Content-Type", "application/json")
}

// func handlePlay(w http.ResponseWriter, r *http.Request) {
// 	buildHeader(&w)
// 	json.NewEncoder(w).Encode(res)

// }

func broadcastLobby(ipWsPairs []IpWsPair){
	names := make([]string, 0)
	for _, pair := range ipWsPairs {
		names = append(names, pair.Name)
	}
	for _, pair := range ipWsPairs {
		namesMap := make(map[string]any)
		namesMap["names"] = names
		pair.Ws.WriteJSON(namesMap)
	}
}

func broadcastStart(ipWsPairs []IpWsPair){
	sgl.Lock()
	portNumber := PortNumber(startPort+gameNumber+1)
	if _, exists := GameList[portNumber]; exists {
		sgl.Unlock()
		return;
	}
	gameNumber++

	log.Printf("Starting game on port %v", portNumber)
	res := make(map[string]any)
	res["portNumber"] = portNumber
	res["start"] = true
	
	startGame(portNumber)
	for _, pair := range ipWsPairs {
		game := GameList[portNumber]	
		player := game.createPlayer(pair.Name)	
		GameConnections[pair.Ip] = GamePlayerPair{GameList[portNumber], player, &pair}
		pair.Ws.WriteJSON(res)
		pair.Ws = nil
	}

	sgl.Unlock()
	log.Printf("GameConnections: %v", GameConnections)
}

func listenForStart(ws *websocket.Conn, gameCode GameCode){
	for {
		var start map[string]bool
		err := ws.ReadJSON(&start)
		if err != nil {
			log.Printf("Error reading JSON: %v", err)
			return
		}
		if start["start"] {
			broadcastStart(Lobbies[gameCode])
			log.Printf("Received start signal: %v", start)
			break
		}
	}
}

func handleJoin(w http.ResponseWriter, r *http.Request){
	ws, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Fatalf("Failed to upgrade to websocket: %v", err)
	}
		
	defer ws.Close()	

	ip := IpAddress(strings.Split(ws.RemoteAddr().String(), ":")[0])
	gameCode := GameCode(r.URL.Query()["gameCode"][0])
	name := r.URL.Query()["name"][0]


	sgl.Lock()
	v, e := Lobbies[gameCode]	
	alreadyJoined := false

	if !e {
		Lobbies[gameCode] = []IpWsPair{{ip, ws, name}}
	}else{
		for i, pair := range v {
			if pair.Ip == ip {
				Lobbies[gameCode][i].Name = name
				Lobbies[gameCode][i].Ws = ws
				alreadyJoined = true
			}
		}
		if !alreadyJoined {
			Lobbies[gameCode] = append(Lobbies[gameCode], IpWsPair{ip, ws, name})
		}
	}
	sgl.Unlock()

	broadcastLobby(Lobbies[gameCode])
	listenForStart(ws, gameCode)
}

func main() {
	// http.HandleFunc("/play", handlePlay)
	http.HandleFunc("/join", handleJoin)

	port:= fmt.Sprintf(":%v", startPort)
	log.Fatal(http.ListenAndServe(port, nil))
}
