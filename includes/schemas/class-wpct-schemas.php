<?php
/**
 * JSON Schema definitions for content type abilities.
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * JSON Schema definitions class.
 *
 * Provides JSON Schema definitions for content type abilities.
 */
class WPCT_Schemas {

	/**
	 * Content type object schema (reusable).
	 *
	 * @return array
	 */
	private static function content_type_object() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'id'     => array(
					'type'        => array( 'integer', 'null' ),
					'description' => 'Unique identifier for the content type. Null for hardcoded types.',
				),
				'name'   => array(
					'type'        => 'string',
					'description' => 'Display name of the content type.',
				),
				'slug'   => array(
					'type'        => 'string',
					'description' => 'URL-friendly identifier.',
				),
				'config' => array(
					'type'        => 'object',
					'description' => 'Content type configuration.',
				),
				'source' => array(
					'type'        => 'string',
					'enum'        => array( 'database', 'hardcoded', 'merged' ),
					'description' => 'Source of the content type definition.',
				),
			),
		);
	}

	/**
	 * Field object schema (reusable).
	 *
	 * @return array
	 */
	private static function field_object() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'key'    => array(
					'type'        => 'string',
					'description' => 'Unique field identifier within the content type.',
				),
				'label'  => array(
					'type'        => 'string',
					'description' => 'Human-readable field label.',
				),
				'type'   => array(
					'type'        => 'string',
					'description' => 'Field type (text, number, etc.).',
				),
				'config' => array(
					'type'        => 'object',
					'description' => 'Field-specific configuration.',
				),
			),
		);
	}

	/**
	 * List content types - input schema.
	 *
	 * @return array
	 */
	public static function list_content_types_input() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'source' => array(
					'type'        => 'string',
					'enum'        => array( 'all', 'database', 'hardcoded' ),
					'description' => 'Filter by content type source.',
					'default'     => 'all',
				),
			),
		);
	}

	/**
	 * List content types - output schema.
	 *
	 * @return array
	 */
	public static function list_content_types_output() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'success' => array( 'type' => 'boolean' ),
				'data'    => array(
					'type'  => 'array',
					'items' => self::content_type_object(),
				),
			),
		);
	}

	/**
	 * Get content type - input schema.
	 *
	 * @return array
	 */
	public static function get_content_type_input() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'id' => array(
					'type'        => 'integer',
					'description' => 'Content type ID.',
				),
			),
			'required'   => array( 'id' ),
		);
	}

	/**
	 * Content type - output schema.
	 *
	 * @return array
	 */
	public static function content_type_output() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'success' => array( 'type' => 'boolean' ),
				'data'    => self::content_type_object(),
				'error'   => array(
					'type'       => 'object',
					'properties' => array(
						'code'    => array( 'type' => 'string' ),
						'message' => array( 'type' => 'string' ),
					),
				),
			),
		);
	}

	/**
	 * Create content type - input schema.
	 *
	 * @return array
	 */
	public static function create_content_type_input() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'name'   => array(
					'type'        => 'string',
					'description' => 'Display name for the content type.',
				),
				'slug'   => array(
					'type'        => 'string',
					'description' => 'URL-friendly identifier.',
					'pattern'     => '^[a-z0-9_]{1,20}$',
				),
				'config' => array(
					'type'        => 'object',
					'description' => 'Content type configuration.',
				),
			),
			'required'   => array( 'name', 'slug' ),
		);
	}

	/**
	 * Update content type - input schema.
	 *
	 * @return array
	 */
	public static function update_content_type_input() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'id'     => array(
					'type'        => 'integer',
					'description' => 'Content type ID to update.',
				),
				'name'   => array(
					'type'        => 'string',
					'description' => 'New display name.',
				),
				'slug'   => array(
					'type'        => 'string',
					'description' => 'New slug.',
				),
				'config' => array(
					'type'        => 'object',
					'description' => 'Updated configuration.',
				),
			),
			'required'   => array( 'id' ),
		);
	}

	/**
	 * Delete content type - input schema.
	 *
	 * @return array
	 */
	public static function delete_content_type_input() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'id' => array(
					'type'        => 'integer',
					'description' => 'Content type ID to delete.',
				),
			),
			'required'   => array( 'id' ),
		);
	}

	/**
	 * Delete content type - output schema.
	 *
	 * @return array
	 */
	public static function delete_content_type_output() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'success' => array( 'type' => 'boolean' ),
				'message' => array( 'type' => 'string' ),
				'error'   => array(
					'type'       => 'object',
					'properties' => array(
						'code'    => array( 'type' => 'string' ),
						'message' => array( 'type' => 'string' ),
					),
				),
			),
		);
	}

	/**
	 * List fields - input schema.
	 *
	 * @return array
	 */
	public static function list_fields_input() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'content_type_id' => array(
					'type'        => 'integer',
					'description' => 'Content type ID.',
				),
			),
			'required'   => array( 'content_type_id' ),
		);
	}

	/**
	 * List fields - output schema.
	 *
	 * @return array
	 */
	public static function list_fields_output() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'success' => array( 'type' => 'boolean' ),
				'data'    => array(
					'type'  => 'array',
					'items' => self::field_object(),
				),
			),
		);
	}

	/**
	 * Add field - input schema.
	 *
	 * @return array
	 */
	public static function add_field_input() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'content_type_id' => array(
					'type'        => 'integer',
					'description' => 'Content type ID.',
				),
				'key'             => array(
					'type'        => 'string',
					'description' => 'Field key.',
				),
				'label'           => array(
					'type'        => 'string',
					'description' => 'Field label.',
				),
				'type'            => array(
					'type'        => 'string',
					'description' => 'Field type.',
				),
				'config'          => array(
					'type'        => 'object',
					'description' => 'Field configuration.',
				),
			),
			'required'   => array( 'content_type_id', 'key', 'type' ),
		);
	}

	/**
	 * Field - output schema.
	 *
	 * @return array
	 */
	public static function field_output() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'success' => array( 'type' => 'boolean' ),
				'data'    => self::field_object(),
				'error'   => array(
					'type'       => 'object',
					'properties' => array(
						'code'    => array( 'type' => 'string' ),
						'message' => array( 'type' => 'string' ),
					),
				),
			),
		);
	}

	/**
	 * Update field - input schema.
	 *
	 * @return array
	 */
	public static function update_field_input() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'content_type_id' => array(
					'type'        => 'integer',
					'description' => 'Content type ID.',
				),
				'field_key'       => array(
					'type'        => 'string',
					'description' => 'Field key to update.',
				),
				'label'           => array(
					'type'        => 'string',
					'description' => 'New field label.',
				),
				'config'          => array(
					'type'        => 'object',
					'description' => 'Updated field configuration.',
				),
			),
			'required'   => array( 'content_type_id', 'field_key' ),
		);
	}

	/**
	 * Remove field - input schema.
	 *
	 * @return array
	 */
	public static function remove_field_input() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'content_type_id' => array(
					'type'        => 'integer',
					'description' => 'Content type ID.',
				),
				'field_key'       => array(
					'type'        => 'string',
					'description' => 'Field key to remove.',
				),
			),
			'required'   => array( 'content_type_id', 'field_key' ),
		);
	}

	/**
	 * Remove field - output schema.
	 *
	 * @return array
	 */
	public static function remove_field_output() {
		return array(
			'type'       => 'object',
			'properties' => array(
				'success' => array( 'type' => 'boolean' ),
				'message' => array( 'type' => 'string' ),
			),
		);
	}
}
