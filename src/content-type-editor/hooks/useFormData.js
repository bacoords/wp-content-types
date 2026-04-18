/**
 * useFormData hook
 *
 * Provides unified form data and a split onChange handler for DataForm
 * that routes updates to either edit() or updateConfig() based on field type.
 */
import { useMemo, useCallback } from '@wordpress/element';

/**
 * Fields that belong to the entity record (vs config).
 */
const RECORD_FIELDS = [ 'title', 'slug' ];

/**
 * Features that are always enabled (not shown in UI).
 * These are required for the block editor and core functionality.
 */
const ALWAYS_ENABLED_SUPPORTS = [ 'editor', 'custom-fields', 'revisions' ];

/**
 * Mapping from form field IDs to support values.
 * Only includes supports that are managed via DataForm (not Fields tab).
 */
const SUPPORT_FIELD_MAP = {
	supports_comments: 'comments',
};

/**
 * Generate a slug from a name string.
 *
 * @param {string} name The name to convert to a slug.
 * @return {string} The generated slug.
 */
function generateSlug( name ) {
	return name
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '_' )
		.replace( /^_+|_+$/g, '' )
		.substring( 0, 20 );
}

/**
 * Custom hook that provides unified form data and a split onChange handler.
 *
 * @param {Object}   options              Hook options.
 * @param {Object}   options.record       The saved record from useEntityRecord.
 * @param {Object}   options.editedRecord The edited record from useEntityRecord.
 * @param {Function} options.edit         The edit function from useEntityRecord.
 * @param {Object}   options.config       The merged config object.
 * @param {Function} options.updateConfig Function to update a config property.
 * @return {Object} Object containing formData and handleFormChange.
 */
export function useFormData( {
	record,
	editedRecord,
	edit,
	config,
	updateConfig,
} ) {
	/**
	 * Unified form data combining record fields and config.
	 * Converts supports array to individual boolean fields.
	 */
	const formData = useMemo( () => {
		const data = {
			title: editedRecord?.title ?? record?.title?.rendered ?? '',
			slug: editedRecord?.slug ?? record?.slug ?? '',
			...config,
			// Always enable REST API (required for block editor)
			show_in_rest: true,
		};

		// Convert supports array to individual boolean fields for DataForm
		const supports = data.supports || [];
		Object.entries( SUPPORT_FIELD_MAP ).forEach(
			( [ fieldId, supportValue ] ) => {
				data[ fieldId ] = supports.includes( supportValue );
			}
		);

		// Remove the supports array from form data (we use individual fields now)
		delete data.supports;

		return data;
	}, [ record, editedRecord, config ] );

	/**
	 * Handle form changes with smart slug auto-generation and split routing.
	 *
	 * @param {Object} edits Object containing field changes.
	 */
	const handleFormChange = useCallback(
		( edits ) => {
			const processedEdits = { ...edits };

			// Smart slug auto-generation when title changes
			if ( 'title' in processedEdits ) {
				const previousAutoSlug = generateSlug( formData.title );
				// Only auto-update slug if it's empty or matches the previous auto-generated slug
				if ( ! formData.slug || formData.slug === previousAutoSlug ) {
					processedEdits.slug = generateSlug( processedEdits.title );
				}
			}

			// Apply slug formatting if slug is being changed directly
			if ( 'slug' in processedEdits && ! ( 'title' in processedEdits ) ) {
				processedEdits.slug = generateSlug( processedEdits.slug );
			}

			// Check if any supports_* field is being changed
			const supportFieldKeys = Object.keys( SUPPORT_FIELD_MAP );
			const changedSupportFields = Object.keys( processedEdits ).filter(
				( key ) => supportFieldKeys.includes( key )
			);

			if ( changedSupportFields.length > 0 ) {
				// Build the new supports array from current config + edits
				// Start with the current supports array to preserve Fields tab settings
				const currentSupports = config.supports || [];
				const newSupports = [ ...currentSupports ];

				// Apply changes from DataForm support fields
				Object.entries( SUPPORT_FIELD_MAP ).forEach(
					( [ fieldId, supportValue ] ) => {
						// Use the edited value if present, otherwise use current form data
						const isEnabled =
							fieldId in processedEdits
								? processedEdits[ fieldId ]
								: formData[ fieldId ];

						const index = newSupports.indexOf( supportValue );
						if ( isEnabled && index === -1 ) {
							newSupports.push( supportValue );
						} else if ( ! isEnabled && index !== -1 ) {
							newSupports.splice( index, 1 );
						}
					}
				);

				// Ensure always-enabled supports are included
				ALWAYS_ENABLED_SUPPORTS.forEach( ( s ) => {
					if ( ! newSupports.includes( s ) ) {
						newSupports.push( s );
					}
				} );

				// Update the supports config
				updateConfig( 'supports', newSupports );

				// Remove the supports_* fields from processedEdits (already handled)
				changedSupportFields.forEach( ( key ) => {
					delete processedEdits[ key ];
				} );
			}

			// Split remaining updates between edit() and updateConfig()
			const recordEdits = {};
			Object.entries( processedEdits ).forEach( ( [ key, value ] ) => {
				if ( RECORD_FIELDS.includes( key ) ) {
					recordEdits[ key ] = value;
				} else {
					updateConfig( key, value );
				}
			} );

			if ( Object.keys( recordEdits ).length > 0 ) {
				edit( recordEdits );
			}
		},
		[ formData, config, edit, updateConfig ]
	);

	return { formData, handleFormChange };
}
