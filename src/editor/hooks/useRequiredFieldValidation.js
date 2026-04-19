/**
 * Required Field Validation Hook
 *
 * Locks post saving when required fields are empty.
 */

import { useEffect, useMemo } from '@wordpress/element';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

const LOCK_NAME = 'wpct-required-fields';

export function useRequiredFieldValidation() {
	const contentType = window.wpctEditorSettings?.contentType;
	const postType = useSelect(
		( select ) => select( 'core/editor' ).getCurrentPostType(),
		[]
	);
	const [ meta ] = useEntityProp( 'postType', postType, 'meta' );
	const { lockPostSaving, unlockPostSaving } = useDispatch( editorStore );

	const requiredFields = useMemo(
		() =>
			( contentType?.config?.fields || [] ).filter( ( f ) => f.required ),
		[ contentType ]
	);

	const hasEmptyRequired = useMemo( () => {
		return requiredFields.some( ( field ) => {
			const value = meta?.[ field.key ];
			// Image fields: 0 is empty
			if ( field.type === 'image' ) {
				return ! value || value === 0;
			}
			return value === undefined || value === null || value === '';
		} );
	}, [ requiredFields, meta ] );

	useEffect( () => {
		if ( hasEmptyRequired ) {
			lockPostSaving( LOCK_NAME );
		} else {
			unlockPostSaving( LOCK_NAME );
		}
	}, [ hasEmptyRequired, lockPostSaving, unlockPostSaving ] );
}
