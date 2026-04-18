/**
 * Full Canvas Editor Component
 *
 * Renders a DataForm in the main content area when block editor is disabled.
 * Uses a React Portal to render into the editor content area.
 */

import { createPortal } from 'react-dom';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useCallback, useEffect, useState } from '@wordpress/element';
import { DataForm } from '@wordpress/dataviews';
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

		if ( field.description ) {
			dataFormField.description = field.description;
		}

		if ( field.placeholder ) {
			dataFormField.placeholder = field.placeholder;
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

export default function FullCanvasEditor() {
	const contentType = window.wpctEditorSettings?.contentType;
	const [ portalContainer, setPortalContainer ] = useState( null );

	const contentTypeFields = useMemo(
		() => contentType?.config?.fields || [],
		[ contentType ]
	);

	const postType = useSelect( ( select ) => {
		return select( 'core/editor' ).getCurrentPostType();
	}, [] );

	const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

	const formData = useMemo( () => {
		const data = {};
		contentTypeFields.forEach( ( field ) => {
			data[ field.key ] = meta?.[ field.key ] ?? '';
		} );
		return data;
	}, [ meta, contentTypeFields ] );

	const dataFormFields = useMemo(
		() => buildDataFormFields( contentTypeFields ),
		[ contentTypeFields ]
	);

	const formLayout = useMemo(
		() => buildFormLayout( contentTypeFields ),
		[ contentTypeFields ]
	);

	const handleChange = useCallback(
		( edits ) => {
			setMeta( {
				...meta,
				...edits,
			} );
		},
		[ meta, setMeta ]
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
				document.body.classList.remove( 'wpct-full-canvas-active' );
			};
		}

		return () => {
			document.body.classList.remove( 'wpct-full-canvas-active' );
		};
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
