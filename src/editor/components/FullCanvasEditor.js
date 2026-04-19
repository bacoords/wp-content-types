/**
 * Full Canvas Editor Component
 *
 * Renders a DataForm in the main content area when block editor is disabled.
 * Uses a React Portal to render into the editor content area.
 */

/* global MutationObserver */

import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	createPortal,
	useMemo,
	useCallback,
	useEffect,
	useState,
} from '@wordpress/element';
import { DataForm } from '@wordpress/dataviews';
import { TextareaControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Map field type to DataForm field type.
 *
 * @param {string} type The content type field type.
 * @return {string} The DataForm field type.
 */
function mapFieldType( type ) {
	const typeMap = {
		text: 'text',
		textarea: 'text', // textarea uses 'text' type with custom Edit component
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
 * Create a textarea Edit component for DataForm.
 *
 * @param {string} fieldKey The field key.
 * @param {string} label    The field label.
 * @return {Function} Edit component.
 */
function createTextareaEdit( fieldKey, label ) {
	return function TextareaEdit( { data, onChange } ) {
		return (
			<TextareaControl
				__nextHasNoMarginBottom
				label={ label }
				value={ data[ fieldKey ] || '' }
				onChange={ ( value ) => onChange( { [ fieldKey ]: value } ) }
				rows={ 4 }
			/>
		);
	};
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

		if ( field.description ) {
			dataFormField.description = field.description;
		}

		if ( field.placeholder ) {
			dataFormField.placeholder = field.placeholder;
		}

		// Textarea fields need a custom Edit component
		if ( field.type === 'textarea' ) {
			dataFormField.Edit = createTextareaEdit(
				field.key,
				field.label || field.key
			);
		}

		// Date fields use compact datetime control
		if ( field.type === 'date' ) {
			dataFormField.Edit = {
				compact: true,
				control: 'datetime',
			};
		}

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

export default function FullCanvasEditor( { includeTitle = true } ) {
	const contentType = window.wpctEditorSettings?.contentType;
	const [ portalContainer, setPortalContainer ] = useState( null );

	const contentTypeFields = useMemo(
		() => contentType?.config?.fields || [],
		[ contentType ]
	);

	// Check if the content type supports title and we should include it.
	const supportsTitle = useMemo( () => {
		if ( ! includeTitle ) {
			return false;
		}
		const supports = contentType?.config?.supports || [
			'title',
			'editor',
			'thumbnail',
			'custom-fields',
		];
		return supports.includes( 'title' );
	}, [ contentType, includeTitle ] );

	const postType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType();
	}, [] );

	const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );
	const [ title, setTitle ] = useEntityProp( 'postType', postType, 'title' );

	const formData = useMemo( () => {
		const data = {};

		// Add title to form data if supported.
		if ( supportsTitle ) {
			data._title = title || '';
		}

		contentTypeFields.forEach( ( field ) => {
			data[ field.key ] = meta?.[ field.key ] ?? '';
		} );
		return data;
	}, [ meta, contentTypeFields, supportsTitle, title ] );

	const dataFormFields = useMemo( () => {
		const fields = [];

		// Add title field at the top if supported.
		if ( supportsTitle ) {
			fields.push( {
				id: '_title',
				label: __( 'Title', 'wp-content-types' ),
				type: 'text',
			} );
		}

		fields.push( ...buildDataFormFields( contentTypeFields ) );
		return fields;
	}, [ contentTypeFields, supportsTitle ] );

	const formLayout = useMemo( () => {
		const fieldIds = [];

		// Add title to layout if supported.
		if ( supportsTitle ) {
			fieldIds.push( '_title' );
		}

		fieldIds.push( ...contentTypeFields.map( ( field ) => field.key ) );

		return {
			type: 'regular',
			fields: fieldIds,
		};
	}, [ contentTypeFields, supportsTitle ] );

	const handleChange = useCallback(
		( edits ) => {
			// Handle title changes separately.
			if ( '_title' in edits ) {
				setTitle( edits._title );
				// Remove title from edits before updating meta.
				const { _title, ...metaEdits } = edits;
				if ( Object.keys( metaEdits ).length > 0 ) {
					setMeta( {
						...meta,
						...metaEdits,
					} );
				}
			} else {
				setMeta( {
					...meta,
					...edits,
				} );
			}
		},
		[ meta, setMeta, setTitle ]
	);

	// Find and set up the portal container
	useEffect( () => {
		const findContainer = () => {
			// Try multiple selectors for the editor content area (not the sidebar)
			const selectors = [
				'.editor-text-editor',
				'.edit-post-visual-editor__content-area',
				'.editor-visual-editor',
			];

			for ( const selector of selectors ) {
				const element = document.querySelector( selector );
				if ( element ) {
					// Create a container div for our portal
					let container = element.querySelector(
						'.wpct-full-canvas-container'
					);
					if ( ! container ) {
						container = document.createElement( 'div' );
						container.className = 'wpct-full-canvas-container';
						element.style.position = 'relative';
						element.appendChild( container );
					}
					return container;
				}
			}
			return null;
		};

		const cleanup = () => {
			document.body.classList.remove( 'wpct-full-canvas-active' );
			// Remove the portal container
			const container = document.querySelector(
				'.wpct-full-canvas-container'
			);
			if ( container && container.parentNode ) {
				container.parentNode.removeChild( container );
			}
		};

		// Add body class
		document.body.classList.add( 'wpct-full-canvas-active' );

		// Try to find container immediately
		let container = findContainer();
		if ( container ) {
			setPortalContainer( container );
		} else {
			// If not found, wait for DOM to be ready
			const observer = new MutationObserver( () => {
				container = findContainer();
				if ( container ) {
					setPortalContainer( container );
					observer.disconnect();
				}
			} );

			observer.observe( document.body, {
				childList: true,
				subtree: true,
			} );

			return () => {
				observer.disconnect();
				cleanup();
			};
		}

		return cleanup;
	}, [] );

	const content =
		contentTypeFields.length === 0 ? (
			<div className="wpct-full-canvas-editor">
				<div className="wpct-full-canvas-editor__empty">
					<p>
						{ __(
							'No custom fields defined for this content type.',
							'wp-content-types'
						) }
					</p>
					<p>
						{ __(
							'Add fields in the Content Type editor to see them here.',
							'wp-content-types'
						) }
					</p>
				</div>
			</div>
		) : (
			<div className="wpct-full-canvas-editor">
				<DataForm
					data={ formData }
					fields={ dataFormFields }
					form={ formLayout }
					onChange={ handleChange }
				/>
			</div>
		);

	// Use portal to render into the editor content area
	if ( portalContainer ) {
		return createPortal( content, portalContainer );
	}

	// Fallback: render inline (will be in plugin slot area)
	return content;
}
