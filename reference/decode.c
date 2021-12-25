#define QOI_IMPLEMENTATION

#include "qio.h"

int main() {
  qoi_desc imgDesc;

  void* decodedImage = qoi_read("../assets/monument.qoi", &imgDesc, 4);
  int decodedLength = imgDesc.width * imgDesc.height * 4;

  FILE* fp = fopen("../decoded.bin", "wb");
  fwrite(decodedImage, 1, decodedLength, fp);
  fclose(fp);

  printf("Wrote decoded QOI image (%i bytes)\n", decodedLength);

  return 0;
}
