import Phaser from "phaser";
import { useState } from "react";

const sizes = {
  width: 500,
  height: 500,
};

const name = localStorage.getItem("name");
const socket = new WebSocket("ws://localhost:8000/ws");

socket.onopen = function(e) {
  console.log("Websocket connected");
};

socket.onclose = function(e) {
  console.log("Websocket disconnected");
};

socket.onerror = function(e) {
  console.log(e);
};

socket.onmessage = function(event) {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case "initial_data":
      console.log("init");
      break;
    case "player_connected":
      console.log("player connected");
      break;
    case "player_disconnected":
      console.log("player disconnected");
      break;
  }
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
      name,
    );

    this.cursor = this.input.keyboard.createCursorKeys("W,A,S,D");
    this.keys = this.input.keyboard.addKeys("W,A,S,D");

    socket.send(JSON.stringify({
      name: name,
      x: this.player.x,
      y: this.player.y,
    }));
  }

  update() {
    const { cursor, player, keys } = this;

    this.nickname.setPosition(player.x - 13, player.y - 35);

    if (cursor.left.isDown || keys.A.isDown) {
      player.setVelocityX(-160);
      socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
      }));
    } else if (cursor.right.isDown || keys.D.isDown) {
      player.setVelocityX(160);
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
      socket.send(JSON.stringify({
        type: "move",
        x: player.x,
        y: player.y,
      }));
    } else if (cursor.down.isDown || keys.S.isDown) {
      player.setVelocityY(160);
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

function General() {
  const game = new Phaser.Game(config);

  return (
    <div>
      <div id="game-container"></div>
    </div>
  );
}

export default General;
