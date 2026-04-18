/**
 * Date Field Preview Component
 */
import { DatePicker } from '@wordpress/components';

export default function DateFieldPreview() {
	return (
		<div className="wpct-field-preview__date">
			<DatePicker currentDate={ null } onChange={ () => {} } />
		</div>
	);
}
