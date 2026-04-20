/**
 * Field Type Picker Component
 *
 * A dropdown popover that displays available field types grouped by category.
 * Similar to WordPress block inserter pattern.
 */
import { Dropdown, MenuGroup, MenuItem, Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { getGroupedFieldTypes } from '../../fields/fieldEditorFields';
import './field-type-picker.css';

export default function FieldTypePicker( { onSelect } ) {
	const groups = getGroupedFieldTypes();

	return (
		<Dropdown
			popoverProps={ { placement: 'bottom-start' } }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					variant="secondary"
					icon={ plus }
					onClick={ onToggle }
					aria-expanded={ isOpen }
					label={ __( 'Add Field', 'wp-content-types' ) }
				/>
			) }
			renderContent={ ( { onClose } ) => (
				<div className="wpct-field-type-picker">
					{ groups.map( ( group ) => (
						<MenuGroup key={ group.id } label={ group.label }>
							{ group.types.map( ( type ) => (
								<MenuItem
									key={ type.id }
									icon={ type.icon }
									iconPosition="left"
									onClick={ () => {
										onSelect( type.id );
										onClose();
									} }
								>
									{ type.label }
								</MenuItem>
							) ) }
						</MenuGroup>
					) ) }
				</div>
			) }
		/>
	);
}
