import Phaser from "phaser";
import { useState } from "react";

const sizes = {
  width: 500,
  height: 500,
};

const name = localStorage.getItem("name");

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player;
    this.cursor;
    this.playerSpeed = 160;
    this.players = {};
  }

  preload() {
    this.load.image("player");
  }

  create() {
    const self = this;
    this.socket = new WebSocket("ws://localhost:8000/ws");

    this.socket.onopen = function(e) {
      console.log("Websocket connected");
      self.socket.send(JSON.stringify({
        name: name,
        x: self.player.x,
        y: self.player.y,
      }));
    };

    this.socket.onclose = function(e) {
      console.log("Websocket disconnected");
    };

    this.socket.onerror = function(e) {
      console.log(e);
    };

    this.socket.onmessage = function(event) {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "initial_data":
          console.log("init");
          break;
        case "player_connected":
          self.addPlayer(message.name, message.x, message.y);
          break;
        case "player_disconnected":
          console.log("player disconnected");
          break;
      }
    };

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
      name,
    );

    this.cursor = this.input.keyboard.createCursorKeys("W,A,S,D");
    this.keys = this.input.keyboard.addKeys("W,A,S,D");
  }

  update() {
    const { cursor, player, keys } = this;

    this.nickname.setPosition(player.x - 13, player.y - 35);

    if (cursor.left.isDown || keys.A.isDown) {
      player.setVelocityX(-160);
      this.socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
      }));
    } else if (cursor.right.isDown || keys.D.isDown) {
      player.setVelocityX(160);
      this.socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
      }));
    } else {
      player.setVelocityX(0);
    }

    if (cursor.up.isDown || keys.W.isDown) {
      player.setVelocityY(-160);
      this.socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
      }));
    } else if (cursor.down.isDown || keys.S.isDown) {
      player.setVelocityY(160);
      this.socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
      }));
    } else {
      player.setVelocityY(0);
    }
  }

  addPlayer(playerName, x, y) {
    if (!this.players[playerName]) {
      const player = this.add.sprite(x, y, "player");
      this.players[playerName] = player;
      console.log(`Player ${playerName} connected`);
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

function General() {
  const game = new Phaser.Game(config);

  return (
    <div>
      <div id="game-container"></div>
    </div>
  );
}

export default General;
