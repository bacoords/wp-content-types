/**
 * Number Field Preview Component
 */
// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
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
