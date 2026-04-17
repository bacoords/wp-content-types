/**
 * Radio Field Preview Component
 */
import { RadioControl } from '@wordpress/components';

export default function RadioFieldPreview( { field } ) {
	const options = field.config?.options || [];

	const radioOptions = options.map( ( opt ) => ( {
		value: opt.value,
		label: opt.label,
	} ) );

	return (
		<RadioControl
			selected=""
			options={ radioOptions }
			onChange={ () => {} }
			disabled
		/>
	);
}
