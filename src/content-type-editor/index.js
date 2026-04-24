/**
 * Content Type Editor Screen
 *
 * Block editor for editing a single content type's configuration.
 */
import { createRoot } from '@wordpress/element';
import { dispatch } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import App from './App';
import './styles.css';

const root = document.getElementById( 'wpct-content-type-editor-root' );

if ( root ) {
	dispatch( preferencesStore )
		.setPersistenceLayer( {
			get: async () =>
				JSON.parse(
					window.localStorage.getItem( 'WPCT_PREFERENCES' ) || '{}'
				),
			set: async ( data ) =>
				window.localStorage.setItem(
					'WPCT_PREFERENCES',
					JSON.stringify( data )
				),
		} )
		.then( () => {
			createRoot( root ).render( <App /> );
		} );
}
