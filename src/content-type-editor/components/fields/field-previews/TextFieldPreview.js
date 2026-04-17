/**
 * Text Field Preview Component
 */
import { TextControl } from '@wordpress/components';

export default function TextFieldPreview( { field } ) {
	const placeholder = field.placeholder || field.config?.placeholder || '';
	const maxLength = field.config?.maxLength;

	return (
		<TextControl
			__nextHasNoMarginBottom
			value=""
			placeholder={ placeholder }
			disabled
			maxLength={ maxLength }
		/>
	);
}
