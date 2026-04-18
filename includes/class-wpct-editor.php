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
				'postType'    => $post_type,
				'contentType' => $content_type,
			)
		);
	}
}
