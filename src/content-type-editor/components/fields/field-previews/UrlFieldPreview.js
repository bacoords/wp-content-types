/**
 * URL Field Preview Component
 */
import { TextControl } from '@wordpress/components';

export default function UrlFieldPreview( { field } ) {
	const placeholder = field.placeholder || field.config?.placeholder || '';

	return (
		<TextControl
			__nextHasNoMarginBottom
			type="url"
			value=""
			placeholder={ placeholder }
			disabled
		/>
	);
}
