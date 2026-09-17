// Generates all placeholder pixel-art textures procedurally (no external asset
// files yet — see ai/CURRENT_STATE.md for the outstanding real pixel-art pass).
import Phaser from 'phaser';
import { CONFIG } from '../config';

const T = CONFIG.tileSize;

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const g = this.add.graphics();
    const tex = (key: string, draw: () => void): void => {
      g.clear();
      draw();
      g.generateTexture(key, T, T);
    };

    tex('floor', () => {
      g.fillStyle(0x2f7a3a, 1);
      g.fillRect(0, 0, T, T);
      g.lineStyle(1, 0x255e2d, 1);
      g.strokeRect(0, 0, T, T);
    });

    tex('hard', () => {
      g.fillStyle(0x4a4a52, 1);
      g.fillRect(0, 0, T, T);
      g.lineStyle(3, 0x18181c, 1);
      g.strokeRect(1.5, 1.5, T - 3, T - 3);
      g.fillStyle(0x6a6a74, 1);
      g.fillRect(4, 4, T - 8, T - 8);
    });

    tex('soft', () => {
      g.fillStyle(0xb5763b, 1);
      g.fillRect(0, 0, T, T);
      g.lineStyle(2, 0x7a4d22, 1);
      g.strokeRect(1, 1, T - 2, T - 2);
      g.lineStyle(1, 0x7a4d22, 1);
      g.lineBetween(0, T / 2, T, T / 2);
      g.lineBetween(T / 2, 0, T / 2, T / 2);
    });

    tex('exit', () => {
      g.fillStyle(0x2f7a3a, 1);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x111111, 1);
      g.fillRoundedRect(6, 4, T - 12, T - 8, 4);
      g.fillStyle(0xffd23f, 1);
      g.fillCircle(T / 2, T / 2, 3);
    });

    tex('item_fire', () => {
      g.fillStyle(0x2f7a3a, 1);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0xff5a1f, 1);
      g.fillTriangle(T / 2, 5, 8, T - 6, T - 8, T - 6);
      g.fillStyle(0xffd23f, 1);
      g.fillTriangle(T / 2, 12, 13, T - 8, T - 13, T - 8);
    });

    tex('item_bomb', () => {
      g.fillStyle(0x2f7a3a, 1);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x111111, 1);
      g.fillCircle(T / 2, T / 2 + 2, 9);
      g.lineStyle(2, 0xffffff, 1);
      g.lineBetween(T / 2, T / 2 - 7, T / 2 + 5, T / 2 - 13);
    });

    tex('item_speed', () => {
      g.fillStyle(0x2f7a3a, 1);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0x3fa9ff, 1);
      g.fillTriangle(10, T - 8, T / 2, 6, T / 2, T / 2);
      g.fillTriangle(T / 2, T - 6, T - 10, T / 2, T / 2, T / 2);
    });

    tex('bomb_idle', () => {
      g.fillStyle(0x111111, 1);
      g.fillCircle(T / 2, T / 2 + 2, 11);
      g.lineStyle(2, 0xffffff, 1);
      g.lineBetween(T / 2, T / 2 - 9, T / 2 + 6, T / 2 - 16);
    });

    tex('bomb_pulse', () => {
      g.fillStyle(0xcc2222, 1);
      g.fillCircle(T / 2, T / 2 + 2, 13);
      g.lineStyle(2, 0xffffff, 1);
      g.lineBetween(T / 2, T / 2 - 11, T / 2 + 7, T / 2 - 18);
    });

    tex('explosion', () => {
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, T, T);
      g.fillStyle(0xffd23f, 1);
      g.fillRect(3, 3, T - 6, T - 6);
      g.fillStyle(0xff5a1f, 1);
      g.fillCircle(T / 2, T / 2, T / 2 - 8);
    });

    tex('player_a', () => {
      g.fillStyle(0x2fa1ff, 1);
      g.fillCircle(T / 2, T / 2, 12);
      g.fillStyle(0x0d3b66, 1);
      g.fillRect(T / 2 - 10, T - 10, 8, 8);
      g.fillRect(T / 2 + 2, T - 8, 8, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(T / 2 - 4, T / 2 - 2, 2);
      g.fillCircle(T / 2 + 4, T / 2 - 2, 2);
    });
    tex('player_b', () => {
      g.fillStyle(0x2fa1ff, 1);
      g.fillCircle(T / 2, T / 2, 12);
      g.fillStyle(0x0d3b66, 1);
      g.fillRect(T / 2 - 10, T - 8, 8, 8);
      g.fillRect(T / 2 + 2, T - 10, 8, 8);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(T / 2 - 4, T / 2 - 2, 2);
      g.fillCircle(T / 2 + 4, T / 2 - 2, 2);
    });

    tex('wanderer_a', () => {
      g.fillStyle(0x3fbf5f, 1);
      g.fillCircle(T / 2, T / 2, 12);
      g.fillStyle(0x111111, 1);
      g.fillCircle(T / 2 - 4, T / 2 - 2, 2);
      g.fillCircle(T / 2 + 4, T / 2 - 2, 2);
    });
    tex('wanderer_b', () => {
      g.fillStyle(0x3fbf5f, 1);
      g.fillEllipse(T / 2, T / 2, 26, 20);
      g.fillStyle(0x111111, 1);
      g.fillCircle(T / 2 - 4, T / 2 - 2, 2);
      g.fillCircle(T / 2 + 4, T / 2 - 2, 2);
    });

    tex('tracker_a', () => {
      g.fillStyle(0xe6453f, 1);
      g.fillCircle(T / 2, T / 2, 12);
      g.fillStyle(0x111111, 1);
      g.fillCircle(T / 2 - 4, T / 2 - 2, 2);
      g.fillCircle(T / 2 + 4, T / 2 - 2, 2);
    });
    tex('tracker_b', () => {
      g.fillStyle(0xe6453f, 1);
      g.fillEllipse(T / 2, T / 2, 26, 20);
      g.fillStyle(0x111111, 1);
      g.fillCircle(T / 2 - 4, T / 2 - 2, 2);
      g.fillCircle(T / 2 + 4, T / 2 - 2, 2);
    });

    g.destroy();
    this.scene.start('Menu');
  }
}
