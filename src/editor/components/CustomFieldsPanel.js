/**
 * Custom Fields Panel Component
 *
 * Displays a full canvas DataForm editor for custom fields.
 * When block editor is disabled, always shows the canvas.
 * When block editor is enabled, provides a toggle button in the header toolbar.
 */

/* global MutationObserver */

import { PluginMoreMenuItem } from '@wordpress/editor';
import { useState, useMemo, useEffect, createPortal } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { blockMeta } from '@wordpress/icons';
import FullCanvasEditor from './FullCanvasEditor';

/**
 * Header Toolbar Button Component
 *
 * Renders a toggle button in the editor header toolbar via portal.
 *
 * @param {Object}   props          Component props.
 * @param {boolean}  props.isActive Whether the canvas mode is active.
 * @param {Function} props.onClick  Click handler for the toggle.
 */
function HeaderToolbarButton( { isActive, onClick } ) {
	const [ container, setContainer ] = useState( null );

	useEffect( () => {
		const findToolbar = () => {
			// Try to find the header toolbar area.
			const selectors = [
				'.editor-header__toolbar',
				'.edit-post-header__toolbar',
				'.editor-document-tools',
			];

			for ( const selector of selectors ) {
				const toolbar = document.querySelector( selector );
				if ( toolbar ) {
					// Create container for our button if it doesn't exist.
					let buttonContainer = toolbar.querySelector(
						'.wpct-toolbar-button-container'
					);
					if ( ! buttonContainer ) {
						buttonContainer = document.createElement( 'div' );
						buttonContainer.className =
							'wpct-toolbar-button-container';
						toolbar.appendChild( buttonContainer );
					}
					return buttonContainer;
				}
			}
			return null;
		};

		// Try to find toolbar immediately.
		let toolbarContainer = findToolbar();
		if ( toolbarContainer ) {
			setContainer( toolbarContainer );
			return;
		}

		// If not found, observe DOM for changes.
		const observer = new MutationObserver( () => {
			toolbarContainer = findToolbar();
			if ( toolbarContainer ) {
				setContainer( toolbarContainer );
				observer.disconnect();
			}
		} );

		observer.observe( document.body, {
			childList: true,
			subtree: true,
		} );

		return () => observer.disconnect();
	}, [] );

	if ( ! container ) {
		return null;
	}

	const label = isActive
		? __( 'Hide Custom Fields', 'wp-content-types' )
		: __( 'Show Custom Fields', 'wp-content-types' );

	return createPortal(
		<Button
			icon={ blockMeta }
			label={ label }
			onClick={ onClick }
			isPressed={ isActive }
			className="wpct-toolbar-toggle"
		/>,
		container
	);
}

export default function CustomFieldsPanel() {
	const contentType = window.wpctEditorSettings?.contentType;
	const useBlockEditor = window.wpctEditorSettings?.useBlockEditor ?? true;

	// Track whether canvas mode is active (for block editor post types).
	const [ isCanvasMode, setIsCanvasMode ] = useState( false );

	// Memoize fields to prevent unnecessary re-renders.
	const contentTypeFields = useMemo(
		() => contentType?.config?.fields || [],
		[ contentType ]
	);

	// If block editor is disabled, always render full canvas mode.
	if ( ! useBlockEditor ) {
		return <FullCanvasEditor />;
	}

	// Don't render anything if no fields.
	if ( contentTypeFields.length === 0 ) {
		return null;
	}

	const toggleLabel = isCanvasMode
		? __( 'Hide Custom Fields', 'wp-content-types' )
		: __( 'Show Custom Fields', 'wp-content-types' );

	return (
		<>
			{ /* Toggle button in the header toolbar */ }
			<HeaderToolbarButton
				isActive={ isCanvasMode }
				onClick={ () => setIsCanvasMode( ! isCanvasMode ) }
			/>

			{ /* Toggle in Tools menu */ }
			<PluginMoreMenuItem
				icon={ blockMeta }
				onClick={ () => setIsCanvasMode( ! isCanvasMode ) }
			>
				{ toggleLabel }
			</PluginMoreMenuItem>

			{ /* Show full canvas editor when in canvas mode */ }
			{ isCanvasMode && <FullCanvasEditor includeTitle={ false } /> }
		</>
	);
}
