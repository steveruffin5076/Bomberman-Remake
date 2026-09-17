import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  private startKey?: Phaser.Input.Keyboard.Key;

  constructor() {
    super('Menu');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0b12);
    this.add
      .text(width / 2, height / 2 - 40, 'BOMBERMAN REMAKE', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffd23f',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2, 'Press SPACE to start', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height / 2 + 30, 'Arrows/WASD move   Space/Z bomb   P pause   R restart', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);

    this.startKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(): void {
    if (this.startKey && Phaser.Input.Keyboard.JustDown(this.startKey)) {
      this.scene.start('Game');
    }
  }
}
