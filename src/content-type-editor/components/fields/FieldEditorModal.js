/**
 * Field Editor Modal Component
 *
 * Modal dialog for editing a field using DataForm.
 */
import {
	Button,
	Modal,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { DataForm } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import {
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef,
} from '@wordpress/element';
import { getFieldEditorFields } from '../../fields/fieldEditorFields';
import { getFieldEditorForm } from '../../forms/fieldEditorForm';
import { generateKey } from '../../hooks/useFieldsManager';

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
		config_min: '',
		config_max: '',
		config_step: '',
		config_rows: '',
	};

	// Flatten config object - merge actual values over defaults
	if ( field.config && typeof field.config === 'object' ) {
		Object.entries( field.config ).forEach( ( [ key, value ] ) => {
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

export default function FieldEditorModal( {
	field,
	onSave,
	onDelete,
	onClose,
} ) {
	// Track which field we're editing by _id to know when to reset local state
	const fieldIdRef = useRef( null );

	// Track if user has manually edited the key field
	const keyManuallyEditedRef = useRef( false );

	// Local state for form data
	const [ localData, setLocalData ] = useState( () => flattenField( field ) );

	// Reset local state when a DIFFERENT field is edited (by _id)
	useEffect( () => {
		if ( field?._id !== fieldIdRef.current ) {
			fieldIdRef.current = field?._id;
			setLocalData( flattenField( field ) );
			// Reset manual edit tracking - consider key manually edited if it already has a value
			keyManuallyEditedRef.current = Boolean( field?.key );
		}
	}, [ field ] );

	// Get fields definition (stable reference)
	const fields = useMemo( () => getFieldEditorFields(), [] );

	// Get form layout based on current type in local state
	const form = useMemo(
		() => getFieldEditorForm( localData.type ),
		[ localData.type ]
	);

	// Handle changes from DataForm - update local state only
	const handleChange = useCallback( ( edits ) => {
		setLocalData( ( prev ) => {
			const newData = { ...prev, ...edits };

			// If user is editing the key field, mark it as manually edited
			if ( 'key' in edits ) {
				keyManuallyEditedRef.current = true;
			}

			// If label changed and key hasn't been manually edited, auto-generate key
			if ( 'label' in edits && ! keyManuallyEditedRef.current ) {
				newData.key = generateKey( edits.label );
			}

			return newData;
		} );
	}, [] );

	// Handle save
	const handleSave = useCallback( () => {
		const unflattened = unflattenData( localData );
		onSave( field?._id, unflattened );
		onClose();
	}, [ localData, field?._id, onSave, onClose ] );

	// Handle delete
	const handleDelete = useCallback( () => {
		/* eslint-disable no-alert */
		if (
			window.confirm(
				__(
					'Are you sure you want to delete this field?',
					'wp-content-types'
				)
			)
		) {
			onDelete( field?._id );
		}
		/* eslint-enable no-alert */
	}, [ field?._id, onDelete ] );

	// Guard against missing field - must be after all hooks
	if ( ! field || ! field._id ) {
		return null;
	}

	// Modal title - new fields have empty label and key
	const isNewField = ! field.label && ! field.key;
	const modalTitle = isNewField
		? __( 'Add Field', 'wp-content-types' )
		: __( 'Edit Field', 'wp-content-types' );

	return (
		<Modal
			title={ modalTitle }
			onRequestClose={ onClose }
			className="wpct-field-editor-modal"
			size="medium"
		>
			<div className="wpct-field-editor-modal__content">
				<DataForm
					key={ `${ field._id }-${ localData.type }` }
					data={ localData }
					fields={ fields }
					form={ form }
					onChange={ handleChange }
				/>
			</div>
			<div className="wpct-field-editor-modal__footer">
				<HStack justify="space-between">
					<Button
						variant="tertiary"
						isDestructive
						onClick={ handleDelete }
					>
						{ __( 'Delete', 'wp-content-types' ) }
					</Button>
					<HStack spacing={ 3 }>
						<Button variant="tertiary" onClick={ onClose }>
							{ __( 'Cancel', 'wp-content-types' ) }
						</Button>
						<Button variant="primary" onClick={ handleSave }>
							{ __( 'Save', 'wp-content-types' ) }
						</Button>
					</HStack>
				</HStack>
			</div>
		</Modal>
	);
}
