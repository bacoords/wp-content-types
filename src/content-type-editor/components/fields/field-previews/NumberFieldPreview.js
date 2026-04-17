/**
 * Number Field Preview Component
 */
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';

export default function NumberFieldPreview( { field } ) {
	const { min, max, step, placeholder } = field.config || {};

	return (
		<NumberControl
			value=""
			placeholder={ placeholder || field.placeholder || '' }
			min={ min }
			max={ max }
			step={ step }
			disabled
		/>
	);
}
