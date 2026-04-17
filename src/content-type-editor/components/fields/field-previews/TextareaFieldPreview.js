/**
 * Textarea Field Preview Component
 */
import { TextareaControl } from '@wordpress/components';

export default function TextareaFieldPreview( { field } ) {
	const placeholder = field.placeholder || field.config?.placeholder || '';
	const rows = field.config?.rows || 4;

	return (
		<TextareaControl
			__nextHasNoMarginBottom
			value=""
			placeholder={ placeholder }
			rows={ rows }
			disabled
		/>
	);
}
