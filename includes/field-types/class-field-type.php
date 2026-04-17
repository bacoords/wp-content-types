<?php
/**
 * Base field type class.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

abstract class WPCT_Field_Type {

	/**
	 * Field type key.
	 *
	 * @var string
	 */
	protected static $type = '';

	/**
	 * Field type label.
	 *
	 * @var string
	 */
	protected static $label = '';

	/**
	 * Get the field type key.
	 *
	 * @return string
	 */
	public static function get_type() {
		return static::$type;
	}

	/**
	 * Get the field type label.
	 *
	 * @return string
	 */
	public static function get_label() {
		return static::$label;
	}

	/**
	 * Get default config for this field type.
	 *
	 * @return array
	 */
	public static function get_default_config() {
		return array();
	}

	/**
	 * Sanitize value for storage.
	 *
	 * @param mixed $value  Raw value.
	 * @param array $config Field config.
	 * @return mixed
	 */
	abstract public static function sanitize( $value, $config );

	/**
	 * Validate value.
	 *
	 * @param mixed $value  Value to validate.
	 * @param array $config Field config.
	 * @return true|WP_Error
	 */
	public static function validate( $value, $config ) {
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
			'type' => 'string',
		);
	}
}
