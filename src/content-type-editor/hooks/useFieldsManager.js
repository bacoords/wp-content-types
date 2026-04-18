/**
 * useFieldsManager hook
 *
 * Custom hook managing selection and CRUD operations for flat fields array.
 * Uses internal _id for stable selection tracking, separate from user-editable key.
 */
import { useState, useCallback, useMemo, useRef } from '@wordpress/element';

/**
 * Generate a unique ID for internal tracking.
 */
let idCounter = 0;
function generateId() {
	idCounter += 1;
	return `_${ Date.now() }_${ idCounter }`;
}

/**
 * Generate a key from a label string.
 *
 * @param {string} label The label to convert to a key.
 * @return {string} The generated key.
 */
function generateKey( label ) {
	return label
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '_' )
		.replace( /^_+|_+$/g, '' )
		.substring( 0, 32 );
}

/**
 * Check if a key is unique within a collection.
 *
 * @param {string} key        The key to check.
 * @param {Array}  collection Array of items with key property.
 * @param {string} excludeId  _id to exclude from check (for edits).
 * @return {boolean} True if the key is unique.
 */
function isKeyUnique( key, collection, excludeId = null ) {
	return ! collection.some(
		( item ) => item.key === key && item._id !== excludeId
	);
}

/**
 * Ensure a key is unique by appending a number if needed.
 *
 * @param {string} baseKey    The base key to make unique.
 * @param {Array}  collection Array of items with key property.
 * @param {string} excludeId  _id to exclude from check (for edits).
 * @return {string} A unique key.
 */
function makeUniqueKey( baseKey, collection, excludeId = null ) {
	if ( isKeyUnique( baseKey, collection, excludeId ) ) {
		return baseKey;
	}

	let counter = 1;
	let uniqueKey = `${ baseKey }_${ counter }`;
	while ( ! isKeyUnique( uniqueKey, collection, excludeId ) ) {
		counter++;
		uniqueKey = `${ baseKey }_${ counter }`;
	}
	return uniqueKey;
}

/**
 * Ensure all items in a collection have _id properties.
 * Assigns IDs to items that don't have them.
 *
 * @param {Array} items Array of items.
 * @return {Array} Items with _id properties.
 */
function ensureIds( items ) {
	if ( ! Array.isArray( items ) ) {
		return [];
	}

	return items.map( ( item ) => {
		if ( item._id ) {
			return item;
		}
		return { ...item, _id: generateId() };
	} );
}

/**
 * Migrate field_groups to flat fields array.
 * Calculates position: (groupIndex * 1000) + (fieldIndex * 10)
 *
 * @param {Object} config The config object.
 * @return {Array} Flat array of fields with positions.
 */
function migrateFieldGroups( config ) {
	const fieldGroups = config.field_groups || [];
	if ( fieldGroups.length === 0 ) {
		return [];
	}

	const migratedFields = [];
	fieldGroups.forEach( ( group, groupIndex ) => {
		const groupFields = group.fields || [];
		groupFields.forEach( ( field, fieldIndex ) => {
			migratedFields.push( {
				...field,
				position: ( groupIndex * 1000 ) + ( fieldIndex * 10 ),
			} );
		} );
	} );

	return migratedFields;
}

/**
 * Custom hook that manages selection and CRUD for flat fields array.
 *
 * @param {Object}   options              Hook options.
 * @param {Object}   options.config       The config object containing fields.
 * @param {Function} options.updateConfig Function to update a config property.
 * @return {Object} Object containing selection state and CRUD methods.
 */
export function useFieldsManager( { config, updateConfig } ) {
	// Selection state: just the field _id or null
	const [ selectedFieldId, setSelectedFieldId ] = useState( null );

	// Ref to track if we've initialized IDs for existing items
	const initializedRef = useRef( false );

	// Get fields with ensured _id properties, migrating from field_groups if needed
	const fields = useMemo( () => {
		// Check for flat fields first
		if ( Array.isArray( config.fields ) && config.fields.length > 0 ) {
			return ensureIds( config.fields );
		}

		// Migrate from field_groups if present
		if ( Array.isArray( config.field_groups ) && config.field_groups.length > 0 ) {
			const migrated = migrateFieldGroups( config );
			return ensureIds( migrated );
		}

		return [];
	}, [ config.fields, config.field_groups ] );

	// Initialize IDs and migrate on first render if needed
	if ( ! initializedRef.current && fields.length > 0 ) {
		const originalFields = config.fields || [];
		const hasFieldGroups = Array.isArray( config.field_groups ) && config.field_groups.length > 0;
		const needsUpdate = hasFieldGroups || originalFields.some( ( f ) => ! f._id );

		if ( needsUpdate ) {
			initializedRef.current = true;
			updateConfig( 'fields', fields );
			// Clean up field_groups if we migrated
			if ( hasFieldGroups ) {
				updateConfig( 'field_groups', undefined );
			}
		} else {
			initializedRef.current = true;
		}
	}

	// Sort fields by position
	const sortedFields = useMemo( () => {
		return [ ...fields ].sort( ( a, b ) => {
			const posA = a.position ?? 0;
			const posB = b.position ?? 0;
			return posA - posB;
		} );
	}, [ fields ] );

	/**
	 * Get the currently selected field object.
	 */
	const selectedField = useMemo( () => {
		if ( ! selectedFieldId ) {
			return null;
		}
		return fields.find( ( f ) => f._id === selectedFieldId ) || null;
	}, [ selectedFieldId, fields ] );

	/**
	 * Select a field by _id.
	 */
	const selectField = useCallback( ( fieldId ) => {
		setSelectedFieldId( fieldId );
	}, [] );

	/**
	 * Clear selection.
	 */
	const clearSelection = useCallback( () => {
		setSelectedFieldId( null );
	}, [] );

	/**
	 * Update the fields config.
	 */
	const updateFields = useCallback(
		( newFields ) => {
			updateConfig( 'fields', newFields );
		},
		[ updateConfig ]
	);

	/**
	 * Update a field (identified by _id).
	 */
	const updateField = useCallback(
		( fieldId, edits ) => {
			const newFields = fields.map( ( field ) => {
				if ( field._id !== fieldId ) {
					return field;
				}

				const updatedField = { ...field, ...edits };

				// If key was cleared, regenerate from label
				if ( 'key' in edits && ! edits.key ) {
					const labelForKey = edits.label || field.label || 'field';
					const newKey = generateKey( labelForKey );
					updatedField.key = makeUniqueKey( newKey, fields, fieldId );
				}

				// Handle type change - clear type-specific config
				if ( 'type' in edits && edits.type !== field.type ) {
					delete updatedField.options;
					delete updatedField.config;
				}

				return updatedField;
			} );

			updateFields( newFields );
		},
		[ fields, updateFields ]
	);

	/**
	 * Add a new field.
	 *
	 * @param {Object} fieldData Optional field data to use instead of defaults.
	 */
	const addField = useCallback( ( fieldData = {} ) => {
		// Calculate max position
		const maxPosition = fields.reduce(
			( max, f ) => Math.max( max, f.position || 0 ),
			0
		);

		// Generate key from label if provided, otherwise use provided key or default
		let fieldKey = fieldData.key;
		if ( ! fieldKey && fieldData.label ) {
			fieldKey = generateKey( fieldData.label );
		}
		if ( ! fieldKey ) {
			fieldKey = 'new_field';
		}

		const newField = {
			_id: generateId(),
			key: makeUniqueKey( fieldKey, fields ),
			label: fieldData.label || 'New Field',
			type: fieldData.type || 'text',
			required: fieldData.required || false,
			position: maxPosition + 10,
			...( fieldData.config && { config: fieldData.config } ),
		};

		updateFields( [ ...fields, newField ] );
		setSelectedFieldId( newField._id );

		return newField;
	}, [ fields, updateFields ] );

	/**
	 * Add multiple fields at once.
	 *
	 * @param {Array} fieldsData Array of field data objects.
	 * @return {Array} Array of created fields.
	 */
	const addFields = useCallback( ( fieldsData = [] ) => {
		if ( ! Array.isArray( fieldsData ) || fieldsData.length === 0 ) {
			return [];
		}

		// Calculate starting position
		let currentPosition = fields.reduce(
			( max, f ) => Math.max( max, f.position || 0 ),
			0
		);

		// Track all fields (existing + new) for unique key generation
		const allFields = [ ...fields ];
		const newFields = [];

		for ( const fieldData of fieldsData ) {
			currentPosition += 10;

			// Generate key from label if provided, otherwise use provided key or default
			let fieldKey = fieldData.key;
			if ( ! fieldKey && fieldData.label ) {
				fieldKey = generateKey( fieldData.label );
			}
			if ( ! fieldKey ) {
				fieldKey = 'new_field';
			}

			const newField = {
				_id: generateId(),
				key: makeUniqueKey( fieldKey, allFields ),
				label: fieldData.label || 'New Field',
				type: fieldData.type || 'text',
				required: fieldData.required || false,
				position: currentPosition,
				...( fieldData.config && { config: fieldData.config } ),
			};

			allFields.push( newField );
			newFields.push( newField );
		}

		updateFields( allFields );

		// Select the last added field
		if ( newFields.length > 0 ) {
			setSelectedFieldId( newFields[ newFields.length - 1 ]._id );
		}

		return newFields;
	}, [ fields, updateFields ] );

	/**
	 * Delete a field by _id.
	 */
	const deleteField = useCallback(
		( fieldId ) => {
			const newFields = fields.filter( ( f ) => f._id !== fieldId );
			updateFields( newFields );

			// Clear selection if deleted field was selected
			if ( selectedFieldId === fieldId ) {
				clearSelection();
			}
		},
		[ fields, updateFields, selectedFieldId, clearSelection ]
	);

	/**
	 * Update a field by its key.
	 *
	 * @param {string} fieldKey The field key to update.
	 * @param {Object} edits    The edits to apply.
	 * @return {boolean} True if field was found and updated.
	 */
	const updateFieldByKey = useCallback(
		( fieldKey, edits ) => {
			const field = fields.find( ( f ) => f.key === fieldKey );
			if ( ! field ) {
				return false;
			}

			updateField( field._id, edits );
			return true;
		},
		[ fields, updateField ]
	);

	/**
	 * Delete a field by its key.
	 *
	 * @param {string} fieldKey The field key to delete.
	 * @return {boolean} True if field was found and deleted.
	 */
	const deleteFieldByKey = useCallback(
		( fieldKey ) => {
			const field = fields.find( ( f ) => f.key === fieldKey );
			if ( ! field ) {
				return false;
			}

			const newFields = fields.filter( ( f ) => f.key !== fieldKey );
			updateFields( newFields );

			// Clear selection if deleted field was selected
			if ( selectedFieldId === field._id ) {
				clearSelection();
			}

			return true;
		},
		[ fields, updateFields, selectedFieldId, clearSelection ]
	);

	return {
		// Selection
		selectedFieldId,
		selectedField,
		selectField,
		clearSelection,

		// Fields
		fields: sortedFields,

		// Field operations
		addField,
		addFields,
		updateField,
		updateFieldByKey,
		deleteField,
		deleteFieldByKey,
	};
}
