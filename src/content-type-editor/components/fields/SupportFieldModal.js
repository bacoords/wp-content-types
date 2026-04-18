/**
 * Support Field Modal Component
 *
 * Simple modal for enabling/disabling a built-in support field.
 */
import { Modal, ToggleControl, Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function SupportFieldModal( {
	field,
	isEnabled,
	onToggle,
	onClose,
} ) {
	return (
		<Modal
			title={ field.label }
			onRequestClose={ onClose }
			className="wpct-support-field-modal"
			size="small"
		>
			<div className="wpct-support-field-modal__content">
				<div className="wpct-support-field-modal__header">
					<span className="wpct-field-badge wpct-field-badge--builtin">
						{ __( 'Built-in', 'wp-content-types' ) }
					</span>
				</div>

				<p className="wpct-support-field-modal__description">
					{ __(
						'This is a built-in WordPress field. You can enable or disable it for this content type.',
						'wp-content-types'
					) }
				</p>

				<ToggleControl
					label={ __( 'Enable this field', 'wp-content-types' ) }
					checked={ isEnabled }
					onChange={ onToggle }
				/>
			</div>

			<div className="wpct-support-field-modal__footer">
				<Button variant="primary" onClick={ onClose }>
					{ __( 'Done', 'wp-content-types' ) }
				</Button>
			</div>
		</Modal>
	);
}
