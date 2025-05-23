import Phaser from "phaser";
import { useState } from "react";

const sizes = {
  width: 1000,
  height: 1000,
};

const name = localStorage.getItem("name");

class GameScene extends Phaser.Scene {
  constructor() {
    super("scene-game");
    this.player;
    this.cursor;
    this.playerSpeed = 160;
    this.players = {};
    this.isAlive = true;
  }

  preload() {
    this.load.image("player", "assets/player.png");
    this.load.image("map", "assets/map.png");
    this.load.image("bullet", "assets/bullet.png");
    this.load.image("pivo", "assets/pivo.png");
    this.load.spritesheet("explosion", "assets/explosion.png", {
      frameWidth: 32,
      frameHeight: 32,
      endFrame: 4,
    });
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

    this.anims.create({
      key: "explode",
      frames: this.anims.generateFrameNumbers("explosion", {
        start: 0,
        end: 3,
      }),
      frameRate: 12,
      repeat: 0,
    });

    this.bullets = this.physics.add.group();
    this.plauersGroup = this.add.group();

    this.add.sprite(500, 500, "map");

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
          Object.entries(message.players).map(([playerName, playerData]) => (
            playerName != name &&
            self.addPlayer(playerName, playerData.x, playerData.y)
          ));
          break;
        case "player_connected":
          self.addPlayer(message.name, message.x, message.y);
          break;
        case "player_update":
          self.movePlayer(message.name, message.x, message.y);
          break;
        case "fire":
          self.fire(message);
          break;
        case "player_disconnected":
          self.removePlayer(message.name);
          break;
      }
    };

    this.player = this.physics.add.image(
      500,
      500,
      "player",
    ).setScale(0.1);
    this.player.setImmovable(true);
    this.player.setCollideWorldBounds(true);
    this.nickname = this.add.text(
      this.player.x,
      this.player.y - 50,
      name,
      {
        fontSize: "25px",
      },
    ).setOrigin(0.5);

    const camera = this.cameras.main;
    camera.startFollow(this.player);
    camera.setDeadzone(100, 100);

    this.input.on("pointerdown", (pointer) => {
      const angle = Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        pointer.x,
        pointer.y,
      );
      const angleInDegrees = Phaser.Math.RadToDeg(angle);

      this.socket.send(JSON.stringify({
        type: "fire",
        playerX: this.player.x,
        playerY: this.player.y,
        pointerX: pointer.x,
        pointerY: pointer.y,
        angle: angleInDegrees,
      }));
    });

    this.cursor = this.input.keyboard.createCursorKeys("W,A,S,D");
    this.keys = this.input.keyboard.addKeys("W,A,S,D,F");
  }

  update() {
    const { cursor, player, keys } = this;

    if (!this.isAlive) return 1;

    this.nickname.setPosition(player.x - 13, player.y - 35);

    this.playersList = Object.values(this.players).map((p) => p.sprite);
    this.physics.world.collide(player, this.playersList);

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
      // const player = this.add.sprite(x, y, "player");
      const playerNameText = this.add.text(x, y - 50, playerName, {
        fontSize: "25px",
      }).setOrigin(
        0.5,
      );

      const player = this.plauersGroup.create(
        x,
        y,
        "player",
      ).setScale(0.1);

      this.physics.add.existing(player);
      player.body.setCollideWorldBounds(true);
      player.body.setImmovable(true);
      player.body.setBounce(0.2);
      player.body.setMass(10);

      this.players[playerName] = {
        sprite: player,
        nameText: playerNameText,
      };
    }
  }

  fire(fireData) {
    const bullet = this.bullets.create(
      fireData.playerX,
      fireData.playerY,
      "bullet",
    ).setScale(0.05);
    this.physics.add.existing(bullet);
    bullet.body.setCollideWorldBounds(true);

    this.physics.add.collider(
      this.bullets,
      this.plauersGroup,
      this.bulletHitPlayer,
      null,
      this,
    );

    this.physics.add.collider(
      this.player,
      this.bullets,
      this.bulletHitThisPlayer,
      null,
      this,
    );

    // this.tweens.add({
    //   targets: bullet,
    //   x: fireData.pointerX,
    //   y: fireData.pointerY,
    //   duration: 100,
    //   ease: "Power1",
    // });

    this.physics.velocityFromAngle(
      fireData.angle, // Угол в градусах
      400, // Скорость
      bullet.body.velocity, // Куда записать вектор скорости
    );

    // Вращаем пулю в направлении движения
    bullet.setRotation(Phaser.Math.DegToRad(fireData.angle));

    this.time.delayedCall(2000, () => {
      if (bullet.active) bullet.destroy();
    });
  }

  movePlayer(playerName, x, y) {
    const playerData = this.players[playerName];
    if (playerData) {
      this.tweens.add({
        targets: playerData.sprite,
        x: x,
        y: y,
        duration: 0,
        ease: "Power1",
      });

      this.tweens.add({
        targets: playerData.nameText,
        x: x,
        y: y - 50,
        duration: 0,
        ease: "Power1",
      });
    }
  }

  bulletHitPlayer(player, bullet) {
    console.log("asd");
    bullet.destroy();
    player.destroy();

    this.createExplosion(player.x, player.y);
  }

  createExplosion(x, y) {
    this.explosion = this.add.sprite(x, y, "explosion")
      .setVisible(false);

    this.explosion
      .setPosition(x, y)
      .setVisible(true)
      .play("explode")
      .setScale(4);

    this.explosion.on("animationcomplete", () => {
      this.explosion.setVisible(false); // скрываем или destroy()
    });
  }

  bulletHitThisPlayer(player, bullet) {
    console.log("asd");
    bullet.destroy();
    this.playerDeath(player);
  }

  playerDeath(player) {
    this.timerText = 3;
    this.isAlive = false;
    player.destroy();
    this.time.delayedCall(
      4000,
      () => {
        this.timer = this.timer - 1;
      },
      [],
      this,
    );

    this.timer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    this.deathText = this.add.text(
      player.x,
      player.y,
      `Сздох лол: ${this.timerText}`,
      { fontSize: "100px" },
    ).setOrigin(
      0.5,
    );
  }

  updateTimer() {
    if (this.timer) {
      this.timerText = this.timerText - 1;
      this.deathText.setText(`Сздох лол: ${this.timerText}`);
    } else {
      this.deathText.destroy();

      window.location.reload();

      this.player = this.physics.add.image(
        500,
        500,
        "player",
      );
      this.player.setImmovable(true);
      this.player.setCollideWorldBounds(true);
      this.nickname = this.add.text(
        this.player.x - 13,
        this.player.y - 35,
        name,
        { fontSize: "50px" },
      );

      this.isAlive = true;
    }
  }

  shutdown() {
    if (this.timer) this.timer.remove();
  }

  removePlayer(playerName) {
    const playerData = this.players[playerName];
    if (playerData) {
      playerData.sprite.destroy();
      playerData.nameText.destroy();
      delete this.players[playerName];
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
      debug: false,
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
