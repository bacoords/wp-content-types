/**
 * Group Editor Panel Component
 *
 * Sidebar panel for editing a field group using DataForm.
 * Uses local state to prevent re-renders on every keystroke.
 */
import {
	Button,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { useState, useEffect, useMemo, useCallback, useRef } from '@wordpress/element';
import { close } from '@wordpress/icons';
import { getGroupEditorFields } from '../../fields/groupEditorFields';
import { GROUP_EDITOR_FORM } from '../../forms/fieldEditorForm';

/**
 * Normalize group data for DataForm.
 *
 * @param {Object} group Group object.
 * @return {Object} Normalized group data.
 */
function normalizeGroup( group ) {
	if ( ! group || typeof group !== 'object' ) {
		return {
			label: '',
			key: '',
			description: '',
			position: '',
		};
	}

	return {
		label: group.label || '',
		key: group.key || '',
		description: group.description || '',
		position: group.position !== undefined && group.position !== null ? String( group.position ) : '',
	};
}

export default function GroupEditorPanel( {
	group,
	onUpdate,
	onDelete,
	onClose,
} ) {
	// Track which group we're editing by _id to know when to reset local state
	const groupIdRef = useRef( null );

	// Local state for form data - prevents re-renders from parent
	const [ localData, setLocalData ] = useState( () => normalizeGroup( group ) );

	// Reset local state when a DIFFERENT group is selected (by _id)
	useEffect( () => {
		if ( group?._id !== groupIdRef.current ) {
			groupIdRef.current = group?._id;
			setLocalData( normalizeGroup( group ) );
		}
	}, [ group ] );

	// Guard against missing group
	if ( ! group || ! group._id ) {
		return null;
	}

	// Get fields for the form (stable reference)
	const fields = useMemo( () => getGroupEditorFields(), [] );

	// Handle changes from DataForm - update local state immediately,
	// then sync to parent
	const handleChange = useCallback(
		( edits ) => {
			setLocalData( ( prev ) => {
				const updated = { ...prev, ...edits };

				// Sync to parent (use setTimeout to avoid state update during render)
				setTimeout( () => {
					onUpdate( group._id, edits );
				}, 0 );

				return updated;
			} );
		},
		[ group._id, onUpdate ]
	);

	// Handle delete
	const handleDelete = useCallback( () => {
		const fieldsCount = ( group.fields || [] ).length;
		let confirmMessage = __( 'Are you sure you want to delete this group?', 'wp-content-types' );

		if ( fieldsCount > 0 ) {
			confirmMessage = fieldsCount === 1
				? __( 'This group contains 1 field. Delete the group and its field?', 'wp-content-types' )
				: `${ __( 'This group contains', 'wp-content-types' ) } ${ fieldsCount } ${ __( 'fields. Delete the group and all its fields?', 'wp-content-types' ) }`;
		}

		// eslint-disable-next-line no-alert
		if ( window.confirm( confirmMessage ) ) {
			onDelete( group._id );
		}
	}, [ group, onDelete ] );

	return (
		<div className="wpct-field-editor-panel">
			<div className="wpct-field-editor-panel__header">
				<Heading level={ 4 }>
					{ __( 'Edit Group', 'wp-content-types' ) }
				</Heading>
				<Button
					icon={ close }
					label={ __( 'Close', 'wp-content-types' ) }
					onClick={ onClose }
				/>
			</div>
			<div className="wpct-field-editor-panel__content">
				<DataForm
					data={ localData }
					fields={ fields }
					form={ GROUP_EDITOR_FORM }
					onChange={ handleChange }
				/>
			</div>
			<div className="wpct-field-editor-panel__delete">
				<Button
					variant="secondary"
					isDestructive
					onClick={ handleDelete }
				>
					{ __( 'Delete Group', 'wp-content-types' ) }
				</Button>
			</div>
		</div>
	);
}
