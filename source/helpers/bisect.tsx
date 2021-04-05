import React from 'dom-chef';
import cache from 'webext-storage-cache';
import select from 'select-dom';

import features from '../features';
import pluralize from './pluralize';

// Split current list of features in half and create an options-like object to be applied on load
// Bisecting 3 features: enable 1
// Bisecting 2 features: enable 1
// Bisecting 1 feature: enable 0 // This is the last step, if the user says No, it's not caused by a JS feature
const getMiddleStep = (list: any[]): number => Math.floor(list.length / 2);

async function onChoiceButtonClick({currentTarget}: React.MouseEvent<HTMLButtonElement>): Promise<void> {
	const answer = currentTarget.value;
	const bisectedFeatures = (await cache.get<FeatureID[]>('bisect'))!;

	if (bisectedFeatures.length > 1) {
		await cache.set('bisect', answer === 'yes' ?
			bisectedFeatures.slice(0, getMiddleStep(bisectedFeatures)) :
			bisectedFeatures.slice(getMiddleStep(bisectedFeatures))
		);

		currentTarget.parentElement!.replaceWith(<div className="btn btn-disabled">Reloading…</div>);
		location.reload();
		return;
	}

	// Last step, no JS feature was enabled
	if (answer === 'yes') {
		createMessageBox('No features were enabled on this page. Try disabling Refined GitHub to see if it belongs to it at all.');
	} else {
		const feature = (
			<a href={'https://github.com/sindresorhus/refined-github/blob/main/source/features/' + bisectedFeatures[0] + '.tsx'}>
				<code>{bisectedFeatures[0]}</code>
			</a>
		);

		createMessageBox(<>The change or issue is caused by {feature}.</>);
	}

	await cache.delete('bisect');
}

async function onEndButtonClick(): Promise<void> {
	await cache.delete('bisect');
	location.reload();
}

function createMessageBox(message: Element | string, extraButtons?: Element): void {
	select('#rgh-bisect-dialog')?.remove();
	document.body.append(
		<div
			id="rgh-bisect-dialog"
			className="Box p-3"
			style={{
				position: 'fixed',
				bottom: '50%',
				right: '50%',
				maxWidth: '600px',
				transform: 'translate(50%, 50%)',
				boxShadow: 'var(--color-toast-shadow)',
				zIndex: 2147483647
			}}
		>
			<p>{message}</p>
			<div className="d-flex flex-justify-between">
				<button type="button" className="btn" onClick={onEndButtonClick}>Exit</button>
				{extraButtons}
			</div>
		</div>
	);
}

export default async function bisectFeatures(): Promise<Record<string, boolean> | void> {
	// `bisect` stores the list of features to be split in half
	const bisectedFeatures = await cache.get<FeatureID[]>('bisect');
	if (!bisectedFeatures) {
		return;
	}

	console.log(`Bisecting ${bisectedFeatures.length} features:\n${bisectedFeatures.join('\n')}`);
	console.log(getMiddleStep(bisectedFeatures));

	const steps = Math.ceil(Math.log2(Math.max(bisectedFeatures.length))) + 1;
	createMessageBox(
		`Do you see the change or issue? (${pluralize(steps, 'last step', '$$ steps remaining')})`,
		<div>
			<button type="button" className="btn btn-danger mr-2" value="no" onClick={onChoiceButtonClick}>No</button>
			<button type="button" className="btn btn-primary" value="yes" onClick={onChoiceButtonClick}>Yes</button>
		</div>
	);

	// Hide message when the process is done elsewhere
	window.addEventListener('visibilitychange', async () => {
		if (!await cache.get<FeatureID[]>('bisect')) {
			createMessageBox('Process completed in another tab');
		}
	});

	const half = getMiddleStep(bisectedFeatures);
	const temporaryOptionsPairs = features.list.map(feature => {
		const index = bisectedFeatures.indexOf(feature);
		return [
			`feature:${feature}`,
			index > -1 && index < half
		];
	});
	const temporaryOptions = Object.fromEntries(temporaryOptionsPairs);
	console.log(temporaryOptions);
	return temporaryOptions;
}
