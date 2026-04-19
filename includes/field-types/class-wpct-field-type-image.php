<?php
/**
 * Image field type.
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Image field type class.
 *
 * Implements an image/media field type that stores attachment IDs.
 */
class WPCT_Field_Type_Image extends WPCT_Field_Type {

	/**
	 * Field type key.
	 *
	 * @var string
	 */
	protected static $type = 'image';

	/**
	 * Field type label.
	 *
	 * @var string
	 */
	protected static $label = 'Image';

	/**
	 * Get default config.
	 *
	 * @return array
	 */
	public static function get_default_config() {
		return array();
	}

	/**
	 * Sanitize value.
	 *
	 * @param mixed $value  Raw value (attachment ID).
	 * @param array $config Field config.
	 * @return int
	 */
	public static function sanitize( $value, $config ) {
		return absint( $value );
	}

	/**
	 * Validate value.
	 *
	 * @param mixed $value  Value to validate.
	 * @param array $config Field config.
	 * @return true|WP_Error
	 */
	public static function validate( $value, $config ) {
		// Allow empty values (no image selected).
		if ( empty( $value ) || 0 === $value ) {
			return true;
		}

		// Ensure it's a valid attachment ID.
		if ( ! is_numeric( $value ) ) {
			return new WP_Error( 'invalid_type', __( 'Value must be a valid attachment ID.', 'wp-content-types' ) );
		}

		$attachment = get_post( absint( $value ) );
		if ( ! $attachment || 'attachment' !== $attachment->post_type ) {
			return new WP_Error( 'invalid_attachment', __( 'The specified attachment does not exist.', 'wp-content-types' ) );
		}

		// Verify it's an image attachment.
		if ( ! wp_attachment_is_image( $attachment->ID ) ) {
			return new WP_Error( 'not_image', __( 'The attachment must be an image.', 'wp-content-types' ) );
		}

		return true;
	}

	/**
	 * Get schema for REST API.
	 *
	 * @param array $config Field config.
	 * @return array
	 */
	public static function get_schema( $config ) {
		return array(
			'type'        => 'integer',
			'description' => __( 'Attachment ID of the image.', 'wp-content-types' ),
			'minimum'     => 0,
		);
	}
}
