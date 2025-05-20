import Phaser from "phaser";

const sizes = {
  width: 500,
  height: 500,
};

const socket = new WebSocket("ws://localhost:8000/ws");

socket.onopen = function(e) {
  console.log("Websocket connected");
  socket.send(JSON.stringify({}));
};

socket.onclose = function(e) {
  console.log("Websocket disconnected");
};

socket.onerror = function(e) {
  console.log(e);
};

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player;
    this.cursor;
    this.playerSpeed = 160;
  }

  preload() {
    this.load.image("player");
  }

  create() {
    this.player = this.physics.add.image(
      sizes.width - 250,
      sizes.height - 250,
      "player",
    );
    this.player.setImmovable(true);
    this.player.setCollideWorldBounds(true);
    this.nickname = this.add.text(
      this.player.x - 13,
      this.player.y - 35,
      "asd",
    );

    this.cursor = this.input.keyboard.createCursorKeys("W,A,S,D");
    this.keys = this.input.keyboard.addKeys("W,A,S,D");
  }

  update() {
    const { cursor, player, keys } = this;

    if (cursor.left.isDown || keys.A.isDown) {
      player.setVelocityX(-160);
      this.nickname.setPosition(player.x - 13, player.y - 35)
      socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
      }));
    } else if (cursor.right.isDown || keys.D.isDown) {
      player.setVelocityX(160);
      this.nickname.setPosition(player.x - 13, player.y - 35)
      socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
      }));
    } else {
      player.setVelocityX(0);
    }

    if (cursor.up.isDown || keys.W.isDown) {
      player.setVelocityY(-160);
      this.nickname.setPosition(player.x - 13, player.y - 35)
      socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
      }));
    } else if (cursor.down.isDown || keys.S.isDown) {
      player.setVelocityY(160);
      this.nickname.setPosition(player.x - 13, player.y - 35)
      socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
      }));
    } else {
      player.setVelocityY(0);
    }
  }
}

const config = {
  type: Phaser.WEBGL,
  width: sizes.width,
  height: sizes.height,
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: true,
    },
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);

function App() {
  return <div id="game-container"></div>;
}

export default App
