package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

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

type Command struct {
	Operation string
	Args      []string
	Serviced  int // -1 if not serviced, 0 is success, 1 is failure
	Message string
	cond *sync.Cond
	mutex *sync.Mutex
}

func makeCommand(command string) *Command {
	cmd := &Command{}
	commandList := strings.Split(command, " ")
	cmd.Operation = commandList[0]
	cmd.Args = make([]string, 0)
	cmd.Args = append(cmd.Args, commandList[1:]...)
	cmd.Serviced = -1
	cmd.mutex = &sync.Mutex{} 
	cmd.cond = sync.NewCond(cmd.mutex)
	return cmd
}

func (c *Command) getCommandString() string {
	return c.Operation + " " + strings.Join(c.Args, " ")
} 

type CommandQueue struct {
	Commands []*Command
	Mutex *sync.Mutex
}

func (cq *CommandQueue) addCommand(command *Command) {
	cq.Mutex.Lock()
	cq.Commands = append(cq.Commands, command)
	cq.Mutex.Unlock()
}

func (cq *CommandQueue) getCommand() *Command {
	cq.Mutex.Lock()
	if len(cq.Commands) == 0 {
		cq.Mutex.Unlock()
		return nil
	}
	command := cq.Commands[0]
	cq.Commands = cq.Commands[1:]
	cq.Mutex.Unlock()
	return command
}

type Game struct {
	Id 	int	
	Players []Player	
	Commands CommandQueue 
	Running bool
	Winner *Player
} 

const TICK_MICROS = 20000 

func (g *Game) handleGameLoop() {
		log.Printf("Game %v is running", g.Id)
	
	for g.Running {
		lastTick := time.Now().Local().UnixMicro()
		for len(g.Commands.Commands) > 0 {
			dt := time.Now().Local().UnixMicro() - lastTick	
			if dt >= TICK_MICROS {
				break
			}
			command := g.Commands.getCommand()
			if command == nil {
				break
			}
			command.mutex.Lock()
			if command.Serviced == -1 {
				command.cond.Broadcast()
				command.Serviced = 0
				command.Message = "Command serviced"
			}
			command.mutex.Unlock()
		}
		dt := time.Now().Local().UnixMicro() - lastTick;
		time.Sleep(time.Duration(TICK_MICROS - dt) * time.Microsecond)
		tick_dt := time.Now().Local().UnixMicro() - lastTick;
		log.Printf("Game %v tick (%v us)", g.Id, tick_dt)	
	}
}

func (g *Game) stopGame() {
	g.Running = false
	if g.Winner != nil {
		log.Printf("Game %v stopped. Winner: %v", g.Id, g.Winner.Name)
	} else {
		log.Printf("Game %v stopped. No winner", g.Id)
	}
	// TODO: Notify players about game stop
}	

func (g *GameNetwork) handleGameLoop() {

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

type GameNetwork struct {
	game *Game
	ipws []IpWsPair
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

func (gp GamePlayerPair) sendCommandResponse(command *Command) {
	if gp.ipws.Ws == nil {
		log.Printf("WebSocket connection is nil for IP: %v", gp.ipws.Ip)
		return
	}
	response := map[string]interface{}{
		"messageType": "commandResponse",
		"data": map[string]interface{}{
			"message": command.Message,
			"success": command.Serviced == 0,
			"command":  command.getCommandString(),
		},
	}
	err := gp.ipws.Ws.WriteJSON(response)
	if err != nil {
		log.Printf("Error sending command response: %v", err)
	}
}

var Lobbies =  make(map[GameCode][]IpWsPair)

var GameConnections = make(map[IpAddress]GamePlayerPair)   

var GameList = make(map[PortNumber]*GameNetwork)

// func broadcastGameState() {
	
// }

func initGame()*Game {
	game := &Game{}
	game.Running = false

	game.Commands = CommandQueue{} 
	game.Commands.Commands = make([]*Command, 0)
	game.Commands.Mutex = &sync.Mutex{}
	game.Winner = nil
	game.Players = make([]Player, 0)
	return game
}

func (g *Game)createPlayer(name string) *Player{
	player := Player{len(g.Players), name}
	g.Players = append(g.Players, player)
	return &player
}

func handleConnectToGame(portNumber PortNumber) http.HandlerFunc{
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
		for {
			var message map[string]any
			err := ws.ReadJSON(&message)
			if err != nil {
				log.Printf("Error reading JSON: %v", err)
				return
			}
			log.Printf("Received message: %v", message)
			if message["messageType"] == "command"{
				data := message["data"].(map[string]any)
				command := makeCommand(data["command"].(string))
				gpPair.game.Commands.addCommand(command) 
				command.mutex.Lock()
				for command.Serviced == -1 {
					command.cond.Wait()
				}
				command.mutex.Unlock()
				gpPair.sendCommandResponse(command)
			}
			if message["stop"] != nil {
				gpPair.game.stopGame()
				break
			}
			if message["gameState"] != nil {
				gpPair.sendMessage("gameState", gpPair.game)
			}
		}
	}
}

func startGame(portNumber PortNumber) {
	game := initGame()
	gameNetwork := &GameNetwork{}
	gameNetwork.game = game
	gameNetwork.ipws = make([]IpWsPair, 0)
	game.Id = int(portNumber)
	game.Running = true
	GameList[portNumber] = gameNetwork
	go game.handleGameLoop()
	slashPort := fmt.Sprintf("/%v", portNumber)
	http.HandleFunc(slashPort, handleConnectToGame(portNumber))
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
		gameNetwork := GameList[portNumber]	
		player := gameNetwork.game.createPlayer(pair.Name)	
		GameConnections[pair.Ip] = GamePlayerPair{GameList[portNumber].game, player, &pair}
		pair.Ws.WriteJSON(res)
		pair.Ws = nil
	}
	sgl.Unlock()
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
			delete(Lobbies, gameCode)
			log.Printf("Received start signal: %v", start)
			break
		}
	}
}

func handleJoinLobby(w http.ResponseWriter, r *http.Request){
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
	http.HandleFunc("/join", handleJoinLobby)

	port:= fmt.Sprintf(":%v", startPort)
	log.Fatal(http.ListenAndServe(port, nil))
}
