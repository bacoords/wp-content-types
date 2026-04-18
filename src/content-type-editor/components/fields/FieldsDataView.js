/**
 * Fields DataView Component
 *
 * Displays fields in a DataViews table with edit modal.
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { DataViews } from '@wordpress/dataviews';
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import FieldEditorModal from './FieldEditorModal';

/**
 * Field type labels for display.
 */
const FIELD_TYPE_LABELS = {
	text: __( 'Text', 'wp-content-types' ),
	textarea: __( 'Textarea', 'wp-content-types' ),
	number: __( 'Number', 'wp-content-types' ),
	email: __( 'Email', 'wp-content-types' ),
	url: __( 'URL', 'wp-content-types' ),
	date: __( 'Date', 'wp-content-types' ),
	select: __( 'Select', 'wp-content-types' ),
	radio: __( 'Radio', 'wp-content-types' ),
	checkbox: __( 'Checkbox', 'wp-content-types' ),
};

export default function FieldsDataView( { fields, onAddField, onUpdateField, onDeleteField } ) {
	// View state for DataViews
	const [ view, setView ] = useState( {
		type: 'table',
		titleField: 'label',
		fields: [ 'key', 'type', 'required' ],
	} );

	// Modal state
	const [ editingField, setEditingField ] = useState( null );

	// Handle opening the edit modal
	const handleEdit = useCallback( ( field ) => {
		setEditingField( field );
	}, [] );

	// Handle closing the modal
	const handleCloseModal = useCallback( () => {
		setEditingField( null );
	}, [] );

	// Handle saving from modal
	const handleSaveField = useCallback(
		( fieldId, edits ) => {
			onUpdateField( fieldId, edits );
		},
		[ onUpdateField ]
	);

	// Handle delete from modal
	const handleDeleteField = useCallback(
		( fieldId ) => {
			onDeleteField( fieldId );
			setEditingField( null );
		},
		[ onDeleteField ]
	);

	// Handle adding a new field
	const handleAddField = useCallback( () => {
		const newField = onAddField();
		// Open the modal for the new field
		if ( newField ) {
			setEditingField( newField );
		}
	}, [ onAddField ] );

	// DataViews field definitions - inside component to access handleEdit
	const dataViewFields = useMemo( () => [
		{
			id: 'label',
			label: __( 'Label', 'wp-content-types' ),
			getValue: ( { item } ) => item.label || '',
			render: ( { item } ) => (
				<button
					type="button"
					className="wpct-field-label-link"
					onClick={ () => handleEdit( item ) }
				>
					{ item.label }
				</button>
			),
			enableGlobalSearch: true,
		},
		{
			id: 'key',
			label: __( 'Key', 'wp-content-types' ),
			getValue: ( { item } ) => item.key || '',
			render: ( { item } ) => (
				<code style={ { fontSize: '12px', background: '#f0f0f0', padding: '2px 6px', borderRadius: '2px' } }>
					{ item.key }
				</code>
			),
		},
		{
			id: 'type',
			label: __( 'Type', 'wp-content-types' ),
			getValue: ( { item } ) => FIELD_TYPE_LABELS[ item.type ] || item.type,
			elements: Object.entries( FIELD_TYPE_LABELS ).map( ( [ value, label ] ) => ( {
				value: label,
				label,
			} ) ),
		},
		{
			id: 'required',
			label: __( 'Required', 'wp-content-types' ),
			getValue: ( { item } ) =>
				item.required
					? __( 'Yes', 'wp-content-types' )
					: __( 'No', 'wp-content-types' ),
			render: ( { item } ) => {
				const isRequired = item.required === true;
				return (
					<span
						style={ {
							color: isRequired ? '#d63638' : '#757575',
							fontSize: '12px',
						} }
					>
						{ isRequired
							? __( 'Required', 'wp-content-types' )
							: __( 'Optional', 'wp-content-types' ) }
					</span>
				);
			},
			elements: [
				{ value: __( 'Yes', 'wp-content-types' ), label: __( 'Yes', 'wp-content-types' ) },
				{ value: __( 'No', 'wp-content-types' ), label: __( 'No', 'wp-content-types' ) },
			],
		},
	], [ handleEdit ] );

	// DataViews actions
	const actions = [
		{
			id: 'edit',
			label: __( 'Edit', 'wp-content-types' ),
			isPrimary: true,
			callback: ( items ) => {
				const item = items[ 0 ];
				handleEdit( item );
			},
		},
		{
			id: 'delete',
			label: __( 'Delete', 'wp-content-types' ),
			isDestructive: true,
			callback: ( items ) => {
				const item = items[ 0 ];
				// eslint-disable-next-line no-alert
				if ( window.confirm( __( 'Are you sure you want to delete this field?', 'wp-content-types' ) ) ) {
					onDeleteField( item._id );
				}
			},
		},
	];

	// Header button for DataViews toolbar
	const headerActions = (
		<Button
			variant="primary"
			icon={ plus }
			onClick={ handleAddField }
		>
			{ __( 'Add Field', 'wp-content-types' ) }
		</Button>
	);

	return (
		<div className="wpct-fields-dataview">
			<DataViews
				data={ fields }
				fields={ dataViewFields }
				view={ view }
				onChangeView={ setView }
				paginationInfo={ { totalItems: fields.length, totalPages: 1 } }
				getItemId={ ( item ) => item._id }
				isLoading={ false }
				defaultLayouts={ { table: {} } }
				actions={ actions }
				header={ headerActions }
			/>
			{ editingField && (
				<FieldEditorModal
					field={ editingField }
					onSave={ handleSaveField }
					onDelete={ handleDeleteField }
					onClose={ handleCloseModal }
				/>
			) }
		</div>
	);
}
