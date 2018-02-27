import select from 'select-dom';

export default function () {
	const updateButton = select(`.branch-action-item form button`);

	if (updateButton) {
		updateButton.setAttribute('data-hotkey', 'u');
	}
}
