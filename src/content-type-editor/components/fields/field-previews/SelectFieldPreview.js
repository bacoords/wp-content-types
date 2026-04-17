/**
 * Select Field Preview Component
 */
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SelectFieldPreview( { field } ) {
	const options = field.config?.options || [];
	const placeholder = field.placeholder || field.config?.placeholder || __( 'Select an option', 'wp-content-types' );

	const selectOptions = [
		{ value: '', label: placeholder, disabled: true },
		...options.map( ( opt ) => ( {
			value: opt.value,
			label: opt.label,
		} ) ),
	];

	return (
		<SelectControl
			__nextHasNoMarginBottom
			value=""
			options={ selectOptions }
			disabled
		/>
	);
}
