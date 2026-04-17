/**
 * Checkbox Field Preview Component
 */
import { CheckboxControl } from '@wordpress/components';

export default function CheckboxFieldPreview( { field } ) {
	const defaultChecked = field.config?.defaultChecked || false;

	return (
		<CheckboxControl
			__nextHasNoMarginBottom
			label={ field.label }
			checked={ defaultChecked }
			onChange={ () => {} }
			disabled
		/>
	);
}
