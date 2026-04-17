/**
 * Field Editor Panel Component
 *
 * Sidebar panel for editing a field using DataForm.
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
import { getFieldEditorFields } from '../../fields/fieldEditorFields';
import { getFieldEditorForm } from '../../forms/fieldEditorForm';

/**
 * Convert options string to array format.
 * Format: "value1|Label One\nvalue2|Label Two"
 *
 * @param {string} optionsString Options in string format.
 * @return {Array} Array of { value, label } objects.
 */
function parseOptions( optionsString ) {
	if ( ! optionsString ) {
		return [];
	}

	return optionsString
		.split( '\n' )
		.filter( ( line ) => line.trim() )
		.map( ( line ) => {
			const [ value, label ] = line.split( '|' );
			return {
				value: value?.trim() || '',
				label: label?.trim() || value?.trim() || '',
			};
		} );
}

/**
 * Convert options array to string format.
 *
 * @param {Array} optionsArray Array of { value, label } objects.
 * @return {string} Options in string format.
 */
function stringifyOptions( optionsArray ) {
	if ( ! Array.isArray( optionsArray ) ) {
		return '';
	}

	return optionsArray
		.map( ( opt ) => {
			if ( opt.value === opt.label ) {
				return opt.value;
			}
			return `${ opt.value }|${ opt.label }`;
		} )
		.join( '\n' );
}

/**
 * Flatten nested config object for DataForm.
 * Converts { config: { min: 1 } } to { config_min: 1 }
 *
 * @param {Object} field Field object.
 * @return {Object} Flattened field object.
 */
function flattenField( field ) {
	if ( ! field || typeof field !== 'object' ) {
		return {
			label: '',
			key: '',
			type: 'text',
			required: false,
			description: '',
			placeholder: '',
			options: '',
			config_min: '',
			config_max: '',
			config_step: '',
			config_rows: '',
		};
	}

	const flat = {
		label: field.label || '',
		key: field.key || '',
		type: field.type || 'text',
		required: Boolean( field.required ),
		description: field.description || '',
		placeholder: field.placeholder || '',
		// Provide defaults for all type-specific config fields
		// to prevent DataForm crashes with undefined values
		config_min: '',
		config_max: '',
		config_step: '',
		config_rows: '',
	};

	// Flatten config object - merge actual values over defaults
	if ( field.config && typeof field.config === 'object' ) {
		Object.entries( field.config ).forEach( ( [ key, value ] ) => {
			// Only include defined values
			if ( value !== undefined && value !== null ) {
				flat[ `config_${ key }` ] = value;
			}
		} );
	}

	// Convert options array to string
	if ( Array.isArray( field.options ) ) {
		flat.options = stringifyOptions( field.options );
	} else if ( typeof field.options === 'string' ) {
		flat.options = field.options;
	} else {
		flat.options = '';
	}

	return flat;
}

/**
 * Unflatten nested config for storage.
 * Converts { config_min: 1 } to { config: { min: 1 } }
 *
 * @param {Object} data Full form data object.
 * @return {Object} Unflattened data with proper structure.
 */
function unflattenData( data ) {
	const result = {};
	const config = {};

	Object.entries( data ).forEach( ( [ key, value ] ) => {
		if ( key.startsWith( 'config_' ) ) {
			const configKey = key.replace( 'config_', '' );
			if ( value !== undefined && value !== null && value !== '' ) {
				config[ configKey ] = value;
			}
		} else if ( key === 'options' ) {
			// Convert options string to array
			result.options = parseOptions( value );
		} else {
			result[ key ] = value;
		}
	} );

	if ( Object.keys( config ).length > 0 ) {
		result.config = config;
	}

	return result;
}

export default function FieldEditorPanel( {
	field,
	groupId,
	onUpdate,
	onDelete,
	onClose,
} ) {
	// Track which field we're editing by _id to know when to reset local state
	const fieldIdRef = useRef( null );

	// Local state for form data - prevents re-renders from parent
	const [ localData, setLocalData ] = useState( () => flattenField( field ) );

	// Reset local state when a DIFFERENT field is selected (by _id)
	useEffect( () => {
		if ( field?._id !== fieldIdRef.current ) {
			fieldIdRef.current = field?._id;
			setLocalData( flattenField( field ) );
		}
	}, [ field ] );

	// Guard against missing field
	if ( ! field || ! field._id ) {
		return null;
	}

	// Get fields definition (stable reference)
	const fields = useMemo( () => getFieldEditorFields(), [] );

	// Get form layout based on current type in local state
	const form = useMemo(
		() => getFieldEditorForm( localData.type ),
		[ localData.type ]
	);

	// Handle changes from DataForm - update local state immediately,
	// then sync to parent
	const handleChange = useCallback(
		( edits ) => {
			setLocalData( ( prev ) => {
				const updated = { ...prev, ...edits };

				// Sync full data to parent (use setTimeout to avoid state update during render)
				setTimeout( () => {
					const unflattened = unflattenData( updated );
					onUpdate( groupId, field._id, unflattened );
				}, 0 );

				return updated;
			} );
		},
		[ groupId, field._id, onUpdate ]
	);

	// Handle delete
	const handleDelete = useCallback( () => {
		// eslint-disable-next-line no-alert
		if ( window.confirm( __( 'Are you sure you want to delete this field?', 'wp-content-types' ) ) ) {
			onDelete( groupId, field._id );
		}
	}, [ groupId, field._id, onDelete ] );

	return (
		<div className="wpct-field-editor-panel">
			<div className="wpct-field-editor-panel__header">
				<Heading level={ 4 }>
					{ __( 'Edit Field', 'wp-content-types' ) }
				</Heading>
				<Button
					icon={ close }
					label={ __( 'Close', 'wp-content-types' ) }
					onClick={ onClose }
				/>
			</div>
			<div className="wpct-field-editor-panel__content">
				<DataForm
					key={ `${ field._id }-${ localData.type }` }
					data={ localData }
					fields={ fields }
					form={ form }
					onChange={ handleChange }
				/>
			</div>
			<div className="wpct-field-editor-panel__delete">
				<Button
					variant="secondary"
					isDestructive
					onClick={ handleDelete }
				>
					{ __( 'Delete Field', 'wp-content-types' ) }
				</Button>
			</div>
		</div>
	);
}
