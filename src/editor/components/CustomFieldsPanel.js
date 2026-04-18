/**
 * Custom Fields Sidebar Component
 *
 * Displays a DataForm with custom fields in a dedicated sidebar,
 * or as a full canvas editor when block editor is disabled.
 */

import { PluginSidebar, PluginSidebarMoreMenuItem } from '@wordpress/editor';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { DataForm } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { blockMeta } from '@wordpress/icons';
import FullCanvasEditor from './FullCanvasEditor';

const SIDEBAR_NAME = 'wpct-custom-fields-sidebar';

/**
 * Map field type to DataForm field type.
 *
 * @param {string} type The content type field type.
 * @return {string} The DataForm field type.
 */
function mapFieldType( type ) {
	const typeMap = {
		text: 'text',
		textarea: 'textarea',
		number: 'integer',
		email: 'text',
		url: 'text',
		date: 'datetime',
		select: 'text',
		radio: 'text',
		checkbox: 'text',
	};

	return typeMap[ type ] || 'text';
}

/**
 * Build DataForm fields from content type fields.
 *
 * @param {Array} fields The content type fields.
 * @return {Array} DataForm field definitions.
 */
function buildDataFormFields( fields ) {
	return fields.map( ( field ) => {
		const dataFormField = {
			id: field.key,
			label: field.label || field.key,
			type: mapFieldType( field.type ),
		};

		// Add description if present
		if ( field.description ) {
			dataFormField.description = field.description;
		}

		// Add placeholder if present
		if ( field.placeholder ) {
			dataFormField.placeholder = field.placeholder;
		}

		// Handle select/radio with options
		if (
			( field.type === 'select' || field.type === 'radio' ) &&
			Array.isArray( field.options )
		) {
			dataFormField.elements = field.options.map( ( opt ) => ( {
				value: opt.value,
				label: opt.label,
			} ) );
		}

		return dataFormField;
	} );
}

/**
 * Build DataForm form layout from content type fields.
 *
 * @param {Array} fields The content type fields.
 * @return {Object} DataForm form layout.
 */
function buildFormLayout( fields ) {
	return {
		type: 'regular',
		fields: fields.map( ( field ) => field.key ),
	};
}

export default function CustomFieldsSidebar() {
	const contentType = window.wpctEditorSettings?.contentType;
	const useBlockEditor = window.wpctEditorSettings?.useBlockEditor ?? true;

	// Memoize fields to prevent unnecessary re-renders
	const contentTypeFields = useMemo(
		() => contentType?.config?.fields || [],
		[ contentType ]
	);

	// If block editor is disabled, render full canvas mode
	if ( ! useBlockEditor ) {
		return <FullCanvasEditor />;
	}

	// Get current post type
	const postType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType();
	}, [] );

	// Get and set meta values
	const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

	// Build form data from meta
	const formData = useMemo( () => {
		const data = {};
		contentTypeFields.forEach( ( field ) => {
			data[ field.key ] = meta?.[ field.key ] ?? '';
		} );
		return data;
	}, [ meta, contentTypeFields ] );

	// Build DataForm fields
	const dataFormFields = useMemo(
		() => buildDataFormFields( contentTypeFields ),
		[ contentTypeFields ]
	);

	// Build form layout
	const formLayout = useMemo(
		() => buildFormLayout( contentTypeFields ),
		[ contentTypeFields ]
	);

	// Handle form changes
	const handleChange = useCallback(
		( edits ) => {
			setMeta( {
				...meta,
				...edits,
			} );
		},
		[ meta, setMeta ]
	);

	// Don't render if no fields
	if ( contentTypeFields.length === 0 ) {
		return null;
	}

	const sidebarTitle =
		contentType?.name || __( 'Custom Fields', 'wp-content-types' );

	return (
		<>
			<PluginSidebarMoreMenuItem
				target={ SIDEBAR_NAME }
				icon={ blockMeta }
			>
				{ sidebarTitle }
			</PluginSidebarMoreMenuItem>
			<PluginSidebar
				name={ SIDEBAR_NAME }
				title={ sidebarTitle }
				icon={ blockMeta }
			>
				<div className="wpct-custom-fields-sidebar">
					<DataForm
						data={ formData }
						fields={ dataFormFields }
						form={ formLayout }
						onChange={ handleChange }
					/>
				</div>
			</PluginSidebar>
		</>
	);
}
