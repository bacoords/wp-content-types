<?php
/**
 * Block editor assets and customizations.
 *
 * @package WP_Content_Types
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Editor class for content types.
 *
 * Handles block editor script/style loading and customizations.
 */
class WPCT_Editor {

	/**
	 * Initialize editor hooks.
	 */
	public static function init() {
		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_assets' ) );
		add_filter( 'block_editor_settings_all', array( __CLASS__, 'filter_editor_settings' ), 10, 2 );
		add_filter( 'admin_body_class', array( __CLASS__, 'add_body_class' ) );
	}

	/**
	 * Filter block editor settings based on content type config.
	 *
	 * @param array                   $settings Block editor settings.
	 * @param WP_Block_Editor_Context $context  Block editor context.
	 * @return array Modified settings.
	 */
	public static function filter_editor_settings( $settings, $context ) {
		if ( ! isset( $context->post ) ) {
			return $settings;
		}

		$post_type    = get_post_type( $context->post );
		$content_type = WPCT_Registry::get( $post_type );

		if ( ! $content_type ) {
			return $settings;
		}

		// Check if block editor should be disabled.
		$use_block_editor = $content_type['config']['use_block_editor'] ?? true;

		if ( ! $use_block_editor ) {
			$settings['richEditingEnabled'] = false;
		}

		return $settings;
	}

	/**
	 * Add body class when block editor is disabled.
	 *
	 * @param string $classes Space-separated list of body classes.
	 * @return string Modified classes.
	 */
	public static function add_body_class( $classes ) {
		global $post;

		if ( ! $post ) {
			return $classes;
		}

		$content_type = WPCT_Registry::get( get_post_type( $post ) );

		if ( ! $content_type ) {
			return $classes;
		}

		$use_block_editor = $content_type['config']['use_block_editor'] ?? true;

		if ( ! $use_block_editor ) {
			$classes .= ' wpct-no-block-editor';
		}

		return $classes;
	}

	/**
	 * Enqueue block editor assets.
	 */
	public static function enqueue_assets() {
		$asset_file = WPCT_PATH . 'build/editor.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'wpct-editor',
			WPCT_URL . 'build/editor.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		$css_file = WPCT_PATH . 'build/editor.css';
		if ( file_exists( $css_file ) ) {
			wp_enqueue_style(
				'wpct-editor',
				WPCT_URL . 'build/editor.css',
				array(),
				$asset['version']
			);
		}

		// Pass content type data to the editor.
		$post_type = get_post_type();
		if ( ! $post_type ) {
			$post_type = isset( $_GET['post_type'] ) ? sanitize_key( $_GET['post_type'] ) : 'post'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		}

		$content_type = WPCT_Registry::get( $post_type );

		wp_localize_script(
			'wpct-editor',
			'wpctEditorSettings',
			array(
				'postType'       => $post_type,
				'contentType'    => $content_type,
				'useBlockEditor' => $content_type['config']['use_block_editor'] ?? true,
			)
		);
	}
}
