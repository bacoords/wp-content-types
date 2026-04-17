/**
 * useFieldsManager hook
 *
 * Custom hook managing selection and CRUD operations for both fields and groups.
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
 * Custom hook that manages selection and CRUD for fields and groups.
 *
 * @param {Object}   options              Hook options.
 * @param {Object}   options.config       The config object containing field_groups.
 * @param {Function} options.updateConfig Function to update a config property.
 * @return {Object} Object containing selection state and CRUD methods.
 */
export function useFieldsManager( { config, updateConfig } ) {
	// Selection state: { type: 'field'|'group', groupId, fieldId? } or null
	// Uses _id for stable tracking
	const [ selection, setSelection ] = useState( null );

	// Ref to track if we've initialized IDs for existing items
	const initializedRef = useRef( false );

	// Get field groups with ensured _id properties
	const fieldGroups = useMemo( () => {
		const groups = config.field_groups || [];
		return ensureIds( groups ).map( ( group ) => ( {
			...group,
			fields: ensureIds( group.fields ),
		} ) );
	}, [ config.field_groups ] );

	// Initialize IDs on first render if needed
	if ( ! initializedRef.current && fieldGroups.length > 0 ) {
		const originalGroups = config.field_groups || [];
		const needsUpdate = originalGroups.some(
			( g, i ) => ! g._id || ( g.fields || [] ).some( ( f ) => ! f._id )
		);

		if ( needsUpdate ) {
			// Update config with IDs added
			initializedRef.current = true;
			updateConfig( 'field_groups', fieldGroups );
		} else {
			initializedRef.current = true;
		}
	}

	/**
	 * Get the currently selected data (field or group object).
	 */
	const selectedData = useMemo( () => {
		if ( ! selection ) {
			return null;
		}

		const group = fieldGroups.find( ( g ) => g._id === selection.groupId );
		if ( ! group ) {
			return null;
		}

		if ( selection.type === 'group' ) {
			return group;
		}

		if ( selection.type === 'field' && selection.fieldId ) {
			return ( group.fields || [] ).find(
				( f ) => f._id === selection.fieldId
			);
		}

		return null;
	}, [ selection, fieldGroups ] );

	/**
	 * Select a field by _id.
	 */
	const selectField = useCallback( ( groupId, fieldId ) => {
		setSelection( { type: 'field', groupId, fieldId } );
	}, [] );

	/**
	 * Select a group by _id.
	 */
	const selectGroup = useCallback( ( groupId ) => {
		setSelection( { type: 'group', groupId } );
	}, [] );

	/**
	 * Clear selection.
	 */
	const clearSelection = useCallback( () => {
		setSelection( null );
	}, [] );

	/**
	 * Update the field_groups config.
	 */
	const updateFieldGroups = useCallback(
		( newGroups ) => {
			updateConfig( 'field_groups', newGroups );
		},
		[ updateConfig ]
	);

	/**
	 * Update a field within a group (identified by _id).
	 */
	const updateField = useCallback(
		( groupId, fieldId, edits ) => {
			const newGroups = fieldGroups.map( ( group ) => {
				if ( group._id !== groupId ) {
					return group;
				}

				const fields = group.fields || [];
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

				return { ...group, fields: newFields };
			} );

			updateFieldGroups( newGroups );
			// No need to update selection - _id stays the same
		},
		[ fieldGroups, updateFieldGroups ]
	);

	/**
	 * Add a new field to a group.
	 */
	const addField = useCallback(
		( groupId ) => {
			const group = fieldGroups.find( ( g ) => g._id === groupId );
			if ( ! group ) {
				return;
			}

			const fields = group.fields || [];
			const newField = {
				_id: generateId(),
				key: makeUniqueKey( 'new_field', fields ),
				label: 'New Field',
				type: 'text',
				required: false,
			};

			const newGroups = fieldGroups.map( ( g ) => {
				if ( g._id !== groupId ) {
					return g;
				}
				return { ...g, fields: [ ...fields, newField ] };
			} );

			updateFieldGroups( newGroups );
			selectField( groupId, newField._id );
		},
		[ fieldGroups, updateFieldGroups, selectField ]
	);

	/**
	 * Delete a field from a group.
	 */
	const deleteField = useCallback(
		( groupId, fieldId ) => {
			const newGroups = fieldGroups.map( ( group ) => {
				if ( group._id !== groupId ) {
					return group;
				}

				const fields = ( group.fields || [] ).filter(
					( f ) => f._id !== fieldId
				);
				return { ...group, fields };
			} );

			updateFieldGroups( newGroups );
			clearSelection();
		},
		[ fieldGroups, updateFieldGroups, clearSelection ]
	);

	/**
	 * Update a group (identified by _id).
	 */
	const updateGroup = useCallback(
		( groupId, edits ) => {
			const newGroups = fieldGroups.map( ( group ) => {
				if ( group._id !== groupId ) {
					return group;
				}

				const updatedGroup = { ...group, ...edits };

				// If key was cleared, regenerate from label
				if ( 'key' in edits && ! edits.key ) {
					const labelForKey = edits.label || group.label || 'group';
					const newKey = generateKey( labelForKey );
					updatedGroup.key = makeUniqueKey( newKey, fieldGroups, groupId );
				}

				return updatedGroup;
			} );

			updateFieldGroups( newGroups );
			// No need to update selection - _id stays the same
		},
		[ fieldGroups, updateFieldGroups ]
	);

	/**
	 * Add a new group.
	 */
	const addGroup = useCallback( () => {
		const maxPosition = fieldGroups.reduce(
			( max, g ) => Math.max( max, g.position || 0 ),
			0
		);

		const newGroup = {
			_id: generateId(),
			key: makeUniqueKey( 'new_group', fieldGroups ),
			label: 'New Group',
			description: '',
			position: maxPosition + 10,
			fields: [],
		};

		updateFieldGroups( [ ...fieldGroups, newGroup ] );
		selectGroup( newGroup._id );
	}, [ fieldGroups, updateFieldGroups, selectGroup ] );

	/**
	 * Delete a group.
	 */
	const deleteGroup = useCallback(
		( groupId ) => {
			const newGroups = fieldGroups.filter( ( g ) => g._id !== groupId );
			updateFieldGroups( newGroups );
			clearSelection();
		},
		[ fieldGroups, updateFieldGroups, clearSelection ]
	);

	return {
		// Selection
		selection,
		selectedData,
		selectField,
		selectGroup,
		clearSelection,

		// Field operations
		updateField,
		addField,
		deleteField,

		// Group operations
		updateGroup,
		addGroup,
		deleteGroup,
	};
}
