export interface BrightnessWorkerRequest {
	imageData: ImageData;
}

export interface BrightnessWorkerResponse {
	brightness: number[];
	width: number;
	height: number;
}

self.onmessage = (event: MessageEvent<BrightnessWorkerRequest>) => {
	const { imageData } = event.data;
	const { width, height, data } = imageData;

	const brightness: number[] = new Array(width * height);

	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 4;
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];
			const a = data[i + 3];

			brightness[y * width + x] = (0.299 * r + 0.587 * g + 0.114 * b) * (a / 255);
		}
	}

	const response: BrightnessWorkerResponse = { brightness, width, height };
	self.postMessage(response);
};
