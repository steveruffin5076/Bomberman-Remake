import Phaser from 'phaser';
import { CONFIG } from './config';
import stage1 from './data/stages/stage1.json';
import BootScene from './scenes/BootScene';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: stage1.cols * CONFIG.tileSize,
  height: stage1.rows * CONFIG.tileSize,
  backgroundColor: '#000000',
  pixelArt: true,
  roundPixels: true,
  scene: [BootScene, MenuScene, GameScene],
});
