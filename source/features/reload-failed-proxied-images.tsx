import delay from 'delay';
import delegate from 'delegate-it';
import loadImage from 'image-promise';
import features from '../libs/features';

async function handleErroredImage({target}: any): Promise<void> {
	await delay(5000);
	try {
		// A clone image retries downloading
		// `loadImage` awaits it
		// If successfully loaded, the failed image will be replaced.
		target.replaceWith(await loadImage(target.cloneNode() as HTMLImageElement));
	} catch {}
}

function init(): void {
	delegate('img[src^="https://camo.githubusercontent.com/"]', 'error', handleErroredImage, true);
}

features.add({
	id: __featureName__,
	description: 'Retries downloading images that failed downloading due to GitHub limited proxying.',
	screenshot: false,
	load: features.onAjaxedPages,
	init
});
