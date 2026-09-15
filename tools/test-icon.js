const sharp = require('sharp');
async function run() {
  await sharp('assets/_originals/phone-stand.jpg')
    .extract({ left: 300, top: 400, width: 300, height: 300 })
    .toFile('assets/_originals/honeycomb-icon.png');
}
run();
