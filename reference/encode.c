#define QOI_IMPLEMENTATION
#include "qio.h"

int main(int argc, char *argv[]) {
  qoi_desc imgDesc = {
    .width      = 735,
    .height     = 588,
    .channels   = 4,
    .colorspace = QOI_LINEAR
  };

  FILE* fp = fopen("../assets/monument.bin", "rb");
  void* buffer = malloc(imgDesc.width * imgDesc.height * imgDesc.channels);
  fread(buffer, imgDesc.width * imgDesc.height * imgDesc.channels, 1, fp);
  fclose(fp);

  int encodedLength;
  void* encodedImage = qoi_encode(buffer, &imgDesc, &encodedLength);

  printf("Final index: %i\n", encodedLength);

  fp = fopen("../assets/monument.qoi", "wb");
  fwrite(encodedImage, 1, encodedLength, fp);
  fclose(fp);

  printf("Wrote QOI image (%i bytes)\n", encodedLength);
  free(buffer);

  return 0;
}
