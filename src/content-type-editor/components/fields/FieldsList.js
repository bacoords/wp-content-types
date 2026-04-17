/**
 * Fields List Component
 *
 * Container component that displays all field groups for a content type.
 * Shows an empty state when no field groups exist.
 */
import {
	Card,
	CardBody,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import FieldGroupCard from './FieldGroupCard';

export default function FieldsList( { fieldGroups = [] } ) {
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
			</div>
		);
	}

	return (
		<div className="wpct-fields-list">
			{ sortedGroups.map( ( group ) => (
				<FieldGroupCard key={ group.key } group={ group } />
			) ) }
		</div>
	);
}
