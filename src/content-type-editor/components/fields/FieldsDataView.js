/**
 * Fields DataView Component
 *
 * Displays fields in a DataViews table with edit modal.
 * Includes built-in support fields and custom fields.
 */
import { useState, useCallback, useMemo } from '@wordpress/element';
import { DataViews } from '@wordpress/dataviews';
import { Button } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import FieldEditorModal from './FieldEditorModal';
import SupportFieldModal from './SupportFieldModal';

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

export default function FieldsDataView( {
	fields,
	onAddField,
	onUpdateField,
	onDeleteField,
	supportFields = [],
	supports = [],
	onToggleSupport,
} ) {
	// View state for DataViews
	const [ view, setView ] = useState( {
		type: 'table',
		titleField: 'label',
		fields: [ 'key', 'type', 'status' ],
	} );

	// Modal state
	const [ editingField, setEditingField ] = useState( null );
	const [ editingSupportField, setEditingSupportField ] = useState( null );

	// Combine support fields with custom fields
	const combinedFields = useMemo( () => {
		// Add enabled status to support fields
		const supportFieldsWithStatus = supportFields.map( ( field ) => ( {
			...field,
			enabled: supports.includes( field.supportKey ),
			type: 'support',
		} ) );

		// Mark custom fields
		const customFieldsWithType = fields.map( ( field ) => ( {
			...field,
			isBuiltIn: false,
		} ) );

		return [ ...supportFieldsWithStatus, ...customFieldsWithType ];
	}, [ supportFields, supports, fields ] );

	// Handle opening the edit modal
	const handleEdit = useCallback( ( field ) => {
		if ( field.isBuiltIn ) {
			setEditingSupportField( field );
		} else {
			setEditingField( field );
		}
	}, [] );

	// Handle closing the modal
	const handleCloseModal = useCallback( () => {
		setEditingField( null );
	}, [] );

	// Handle closing support field modal
	const handleCloseSupportModal = useCallback( () => {
		setEditingSupportField( null );
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

	// Handle toggling support field
	const handleToggleSupportField = useCallback( () => {
		if ( editingSupportField && onToggleSupport ) {
			onToggleSupport( editingSupportField.supportKey );
		}
	}, [ editingSupportField, onToggleSupport ] );

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
				<div className="wpct-field-label-cell">
					<button
						type="button"
						className="wpct-field-label-link"
						onClick={ () => handleEdit( item ) }
					>
						{ item.label }
					</button>
					{ item.isBuiltIn && (
						<span className="wpct-field-badge wpct-field-badge--builtin">
							{ __( 'Built-in', 'wp-content-types' ) }
						</span>
					) }
				</div>
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
			getValue: ( { item } ) => {
				if ( item.isBuiltIn ) {
					return __( 'WordPress', 'wp-content-types' );
				}
				return FIELD_TYPE_LABELS[ item.type ] || item.type;
			},
			elements: [
				{ value: __( 'WordPress', 'wp-content-types' ), label: __( 'WordPress', 'wp-content-types' ) },
				...Object.entries( FIELD_TYPE_LABELS ).map( ( [ value, label ] ) => ( {
					value: label,
					label,
				} ) ),
			],
		},
		{
			id: 'status',
			label: __( 'Status', 'wp-content-types' ),
			getValue: ( { item } ) => {
				if ( item.isBuiltIn ) {
					return item.enabled
						? __( 'Enabled', 'wp-content-types' )
						: __( 'Disabled', 'wp-content-types' );
				}
				return item.required
					? __( 'Required', 'wp-content-types' )
					: __( 'Optional', 'wp-content-types' );
			},
			render: ( { item } ) => {
				if ( item.isBuiltIn ) {
					return (
						<span
							className={ `wpct-status-badge wpct-status-badge--${ item.enabled ? 'enabled' : 'disabled' }` }
						>
							{ item.enabled
								? __( 'Enabled', 'wp-content-types' )
								: __( 'Disabled', 'wp-content-types' ) }
						</span>
					);
				}
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
				{ value: __( 'Enabled', 'wp-content-types' ), label: __( 'Enabled', 'wp-content-types' ) },
				{ value: __( 'Disabled', 'wp-content-types' ), label: __( 'Disabled', 'wp-content-types' ) },
				{ value: __( 'Required', 'wp-content-types' ), label: __( 'Required', 'wp-content-types' ) },
				{ value: __( 'Optional', 'wp-content-types' ), label: __( 'Optional', 'wp-content-types' ) },
			],
		},
	], [ handleEdit ] );

	// DataViews actions
	const actions = useMemo( () => [
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
			isEligible: ( item ) => ! item.isBuiltIn,
			callback: ( items ) => {
				const item = items[ 0 ];
				// eslint-disable-next-line no-alert
				if ( window.confirm( __( 'Are you sure you want to delete this field?', 'wp-content-types' ) ) ) {
					onDeleteField( item._id );
				}
			},
		},
	], [ handleEdit, onDeleteField ] );

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
				data={ combinedFields }
				fields={ dataViewFields }
				view={ view }
				onChangeView={ setView }
				paginationInfo={ { totalItems: combinedFields.length, totalPages: 1 } }
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
			{ editingSupportField && (
				<SupportFieldModal
					field={ editingSupportField }
					isEnabled={ supports.includes( editingSupportField.supportKey ) }
					onToggle={ handleToggleSupportField }
					onClose={ handleCloseSupportModal }
				/>
			) }
		</div>
	);
}
