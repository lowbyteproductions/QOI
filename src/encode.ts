import * as fs from 'fs/promises';
import * as path from 'path';

const imageWidth = 735;
const imageHeight = 588;
const channels = 4;

type Color = {
  r: number;
  g: number;
  b: number;
  a: number;
};

const colorsEqual = (c0: Color, c1: Color) => (
  c0.r === c1.r
  && c0.g === c1.g
  && c0.b === c1.b
  && c0.a === c1.a
);

const colorDiff = (c0: Color, c1: Color): Color => ({
  r: c0.r - c1.r,
  g: c0.g - c1.g,
  b: c0.b - c1.b,
  a: c0.a - c1.a,
});

const QOI_HEADER_SIZE = 14;
const QOI_END_MARKER = [0, 0, 0, 0, 0, 0, 0, 1];
const QOI_END_MARKER_SIZE = QOI_END_MARKER.length;

const QOI_OP_RUN   = 0xc0;
const QOI_OP_INDEX = 0x00;
const QOI_OP_DIFF  = 0x40;
const QOI_OP_LUMA  = 0x80;
const QOI_OP_RGB   = 0xfe;
const QOI_OP_RGBA  = 0xff;

const main = async () => {
  const file = await fs.readFile(path.join(__dirname, '..', 'assets', 'monument.bin'));
  const buffer = new Uint8Array(file.buffer);

  const imageSize = buffer.byteLength;
  const lastPixel = imageSize - channels;

  let prevColor: Color = { r: 0, g: 0, b: 0, a: 255 };
  let run = 0;
  const seenPixels: Array<Color> = Array.from({length: 64}, () => ({ r: 0, g: 0, b: 0, a: 0 }));

  const maxSize = imageWidth * imageHeight * (channels + 1) + QOI_HEADER_SIZE + QOI_END_MARKER_SIZE;
  const bytes = new Uint8Array(maxSize);
  let index = 0;

  const write32 = (value: number) => {
    bytes[index++] = (value & 0xff000000) >> 24;
    bytes[index++] = (value & 0x00ff0000) >> 16;
    bytes[index++] = (value & 0x0000ff00) >> 8;
    bytes[index++] = (value & 0x000000ff) >> 0;
  };

  // Write the header
  write32(0x716f6966);
  write32(imageWidth);
  write32(imageHeight);
  bytes[index++] = channels;
  bytes[index++] = 1;

  for (let offset = 0; offset <= lastPixel; offset += channels) {
    const color: Color = {
      r: buffer[offset + 0],
      g: buffer[offset + 1],
      b: buffer[offset + 2],
      a: (channels === 4) ? buffer[offset + 3] : prevColor.a
    };

    if (colorsEqual(color, prevColor)) {
      run++;
      if (run === 62 || offset === lastPixel) {
        bytes[index++] = QOI_OP_RUN | (run - 1);
        run = 0;
      }
    } else {
      if (run > 0) {
        bytes[index++] = QOI_OP_RUN | (run - 1);
        run = 0;
      }

      const hash = (color.r * 3 + color.g * 5 + color.b * 7 + color.a * 11) % 64;
      if (colorsEqual(color, seenPixels[hash])) {
        bytes[index++] = QOI_OP_INDEX | (hash);
      } else {
        seenPixels[hash] = {...color};

        const diff = colorDiff(color, prevColor);
        const dr_dg = diff.r - diff.g;
        const db_dg = diff.b - diff.g;

        if (diff.a === 0) {
          if ((diff.r >= -2 && diff.r <= 1) && (diff.g >= -2 && diff.g <= 1) && (diff.b >= -2 && diff.b <= 1)) {
            bytes[index++] = (
              QOI_OP_DIFF
              | ((diff.r + 2) << 4)
              | ((diff.g + 2) << 2)
              | ((diff.b + 2) << 0)
            );
          } else if ((diff.g >= -32 && diff.g <= 31) && (dr_dg >= -8 && dr_dg <= 7) && (db_dg >= -8 && db_dg <= 7)) {
            bytes[index++] = QOI_OP_LUMA | (diff.g + 32);
            bytes[index++] = ((dr_dg + 8) << 4) | (db_dg + 8);
          } else {
            bytes[index++] = QOI_OP_RGB;
            bytes[index++] = color.r;
            bytes[index++] = color.g;
            bytes[index++] = color.b;
          }
        } else {
          bytes[index++] = QOI_OP_RGBA;
          bytes[index++] = color.r;
          bytes[index++] = color.g;
          bytes[index++] = color.b;
          bytes[index++] = color.a;
        }
      }
    }

    prevColor = {...color};
  }

  QOI_END_MARKER.forEach(b => {
    bytes[index++] = b;
  });

  return fs.writeFile('encoded-ts.qoi', bytes.slice(0, index));
}

main();
