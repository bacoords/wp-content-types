<?php
/**
 * Field model and storage.
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Field model and storage class.
 *
 * Handles CRUD operations for fields within content types.
 */
class WPCT_Field {

	/**
	 * Get all fields for a content type.
	 *
	 * @param int $content_type_id Content type ID.
	 * @return array
	 */
	public static function get_all( $content_type_id ) {
		$content_type = WPCT_Content_Type::get( $content_type_id );

		if ( ! $content_type ) {
			return array();
		}

		return $content_type['config']['fields'] ?? array();
	}

	/**
	 * Get a single field by key.
	 *
	 * @param int    $content_type_id Content type ID.
	 * @param string $field_key       Field key.
	 * @return array|null
	 */
	public static function get( $content_type_id, $field_key ) {
		$fields = self::get_all( $content_type_id );

		foreach ( $fields as $field ) {
			if ( $field['key'] === $field_key ) {
				return $field;
			}
		}

		return null;
	}

	/**
	 * Add a field to a content type.
	 *
	 * @param int   $content_type_id Content type ID.
	 * @param array $field_data      Field data.
	 * @return bool
	 */
	public static function add( $content_type_id, $field_data ) {
		$content_type = WPCT_Content_Type::get( $content_type_id );

		if ( ! $content_type ) {
			return false;
		}

		$config           = $content_type['config'];
		$config['fields'] = $config['fields'] ?? array();

		$config['fields'][] = array(
			'key'    => sanitize_key( $field_data['key'] ?? '' ),
			'label'  => sanitize_text_field( $field_data['label'] ?? '' ),
			'type'   => sanitize_key( $field_data['type'] ?? 'text' ),
			'config' => $field_data['config'] ?? array(),
		);

		return WPCT_Content_Type::update(
			$content_type_id,
			array( 'config' => $config )
		);
	}

	/**
	 * Update a field in a content type.
	 *
	 * @param int    $content_type_id Content type ID.
	 * @param string $field_key       Field key.
	 * @param array  $field_data      Field data.
	 * @return bool
	 */
	public static function update( $content_type_id, $field_key, $field_data ) {
		$content_type = WPCT_Content_Type::get( $content_type_id );

		if ( ! $content_type ) {
			return false;
		}

		$config = $content_type['config'];
		$fields = $config['fields'] ?? array();

		foreach ( $fields as $index => $field ) {
			if ( $field['key'] === $field_key ) {
				$fields[ $index ] = array_merge( $field, $field_data );
				break;
			}
		}

		$config['fields'] = $fields;

		return WPCT_Content_Type::update(
			$content_type_id,
			array( 'config' => $config )
		);
	}

	/**
	 * Remove a field from a content type.
	 *
	 * @param int    $content_type_id Content type ID.
	 * @param string $field_key       Field key.
	 * @return bool
	 */
	public static function remove( $content_type_id, $field_key ) {
		$content_type = WPCT_Content_Type::get( $content_type_id );

		if ( ! $content_type ) {
			return false;
		}

		$config = $content_type['config'];
		$fields = $config['fields'] ?? array();

		$config['fields'] = array_values(
			array_filter(
				$fields,
				function ( $field ) use ( $field_key ) {
					return $field['key'] !== $field_key;
				}
			)
		);

		return WPCT_Content_Type::update(
			$content_type_id,
			array( 'config' => $config )
		);
	}
}
