/**
 * Fields List Component
 *
 * Container component that displays all field groups for a content type.
 * Shows an empty state when no field groups exist.
 */
import {
	Button,
	Card,
	CardBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import FieldGroupCard from './FieldGroupCard';

export default function FieldsList( {
	fieldGroups = [],
	selection,
	onSelectGroup,
	onSelectField,
	onAddField,
	onAddGroup,
} ) {
	// Sort groups by position
	const sortedGroups = [ ...fieldGroups ].sort( ( a, b ) => {
		const posA = a.position ?? 0;
		const posB = b.position ?? 0;
		return posA - posB;
	} );

	if ( sortedGroups.length === 0 ) {
		return (
			<div className="wpct-fields-list wpct-fields-list--empty">
				<Card>
					<CardBody>
						<div className="wpct-fields-list__empty-state">
							<p>
								{ __( 'No custom fields have been added to this content type.', 'wp-content-types' ) }
							</p>
							<p className="wpct-fields-list__empty-hint">
								{ __( 'Custom fields allow you to add additional data inputs when creating content.', 'wp-content-types' ) }
							</p>
						</div>
					</CardBody>
				</Card>
				<div className="wpct-fields-list__add-group">
					<Button
						variant="secondary"
						icon={ plus }
						onClick={ onAddGroup }
					>
						{ __( 'Add Field Group', 'wp-content-types' ) }
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="wpct-fields-list">
			{ sortedGroups.map( ( group ) => {
				const isGroupSelected =
					selection?.type === 'group' &&
					selection?.groupId === group._id;
				const selectedFieldId =
					selection?.type === 'field' &&
					selection?.groupId === group._id
						? selection.fieldId
						: null;

				return (
					<FieldGroupCard
						key={ group._id || group.key }
						group={ group }
						isSelected={ isGroupSelected }
						selectedFieldId={ selectedFieldId }
						onSelectGroup={ onSelectGroup }
						onSelectField={ onSelectField }
						onAddField={ onAddField }
					/>
				);
			} ) }
			<div className="wpct-fields-list__add-group">
				<Button
					variant="secondary"
					icon={ plus }
					onClick={ onAddGroup }
				>
					{ __( 'Add Field Group', 'wp-content-types' ) }
				</Button>
			</div>
		</div>
	);
}
