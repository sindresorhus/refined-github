import delay from 'delay';
import React from 'dom-chef';
import {CheckIcon} from '@primer/octicons-react';

function ToastSpinner(): JSX.Element {
	return (
		<svg className="Toast--spinner" viewBox="0 0 32 32" width="18" height="18">
			<path fill="#959da5" d="M16 0 A16 16 0 0 0 16 32 A16 16 0 0 0 16 0 M16 4 A12 12 0 0 1 16 28 A12 12 0 0 1 16 4"/>
			<path fill="#ffffff" d="M16 0 A16 16 0 0 1 32 16 L28 16 A12 12 0 0 0 16 4z"/>
		</svg>
	);
}

export default async function showToast(
	message = 'Bulk actions currently being processed.'
): Promise<(message?: string) => Promise<void>> {
	const iconWrapper = <span className="Toast-icon"><ToastSpinner/></span>;
	const messageWrapper = <span className="Toast-content">{message}</span>;
	const toast = (
		<div
			role="log"
			style={{zIndex: 101}}
			className="rgh-toast position-fixed bottom-0 right-0 ml-5 mb-5 anim-fade-in fast Toast Toast--loading"
		>
			{iconWrapper}
			{messageWrapper}
		</div>
	);

	document.body.append(toast);
	await delay(30); // Without this, the Toast doesn't appear in time

	return async (
		message = 'Bulk action processing complete.'
	): Promise<void> => {
		toast.classList.replace('Toast--loading', 'Toast--success');
		messageWrapper.textContent = message;
		iconWrapper.firstChild!.replaceWith(<CheckIcon/>);

		await delay(3000);
		toast.remove();
	};
}

