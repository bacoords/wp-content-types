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
 */
const ALWAYS_ENABLED_SUPPORTS = [ 'editor', 'custom-fields' ];

/**
 * Mapping from form field IDs to support values.
 */
const SUPPORT_FIELD_MAP = {
	supports_title: 'title',
	supports_author: 'author',
	supports_thumbnail: 'thumbnail',
	supports_excerpt: 'excerpt',
	supports_comments: 'comments',
	supports_revisions: 'revisions',
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
		};

		// Convert supports array to individual boolean fields
		const supports = data.supports || [];
		Object.entries( SUPPORT_FIELD_MAP ).forEach( ( [ fieldId, supportValue ] ) => {
			data[ fieldId ] = supports.includes( supportValue );
		} );

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
				if (
					! formData.slug ||
					formData.slug === previousAutoSlug
				) {
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
				// Build the new supports array from current form state + edits
				const newSupports = [ ...ALWAYS_ENABLED_SUPPORTS ];

				Object.entries( SUPPORT_FIELD_MAP ).forEach( ( [ fieldId, supportValue ] ) => {
					// Use the edited value if present, otherwise use current form data
					const isEnabled = fieldId in processedEdits
						? processedEdits[ fieldId ]
						: formData[ fieldId ];

					if ( isEnabled && ! newSupports.includes( supportValue ) ) {
						newSupports.push( supportValue );
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
		[ formData, edit, updateConfig ]
	);

	return { formData, handleFormChange };
}
