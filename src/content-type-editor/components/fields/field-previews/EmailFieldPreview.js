/**
 * Email Field Preview Component
 */
import { TextControl } from '@wordpress/components';

export default function EmailFieldPreview( { field } ) {
	const placeholder = field.placeholder || field.config?.placeholder || '';

	return (
		<TextControl
			__nextHasNoMarginBottom
			type="email"
			value=""
			placeholder={ placeholder }
			disabled
		/>
	);
}
