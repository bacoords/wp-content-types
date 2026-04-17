<?php
/**
 * Text field type.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class WPCT_Field_Type_Text extends WPCT_Field_Type {

	/**
	 * Field type key.
	 *
	 * @var string
	 */
	protected static $type = 'text';

	/**
	 * Field type label.
	 *
	 * @var string
	 */
	protected static $label = 'Text';

	/**
	 * Get default config.
	 *
	 * @return array
	 */
	public static function get_default_config() {
		return array(
			'placeholder' => '',
			'max_length'  => 0,
		);
	}

	/**
	 * Sanitize value.
	 *
	 * @param mixed $value  Raw value.
	 * @param array $config Field config.
	 * @return string
	 */
	public static function sanitize( $value, $config ) {
		$value = sanitize_text_field( $value );

		$max_length = $config['max_length'] ?? 0;
		if ( $max_length > 0 && strlen( $value ) > $max_length ) {
			$value = substr( $value, 0, $max_length );
		}

		return $value;
	}

	/**
	 * Validate value.
	 *
	 * @param mixed $value  Value to validate.
	 * @param array $config Field config.
	 * @return true|WP_Error
	 */
	public static function validate( $value, $config ) {
		if ( ! is_string( $value ) ) {
			return new WP_Error( 'invalid_type', 'Value must be a string' );
		}

		return true;
	}

	/**
	 * Get schema.
	 *
	 * @param array $config Field config.
	 * @return array
	 */
	public static function get_schema( $config ) {
		$schema = array(
			'type' => 'string',
		);

		$max_length = $config['max_length'] ?? 0;
		if ( $max_length > 0 ) {
			$schema['maxLength'] = $max_length;
		}

		return $schema;
	}
}
