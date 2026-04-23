# WP Content Types (alpha)

A native WordPress content modeling system built for the Gutenberg era.

[Try it out on Playground](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/bacoords/wp-content-types/refs/head/main/brueprint.json)

## What is this?

WP Content Types lets you create and manage custom post types and custom fields directly in WordPress without relying on legacy plugins. It's designed from the ground up around modern WordPress architecture—no meta boxes, no classic editor screens, just a clean Gutenberg-native experience.

This plugin is a fresh start. It focuses purely on content structure rather than trying to be a design tool. You define your content models, enter data through a modern form-based UI, and let the Site Editor and Block Bindings handle how that content gets displayed.

**Guiding Vision: Content entry and content display are separate concerns.**

## Features

- **Modern Post Type Management** — Create, edit, and configure custom post types using Gutenberg components
- **Custom Fields** — Define fields attached to post types: text, textarea, number, select, boolean, date, image, relationship
- **Gutenberg-Native Editing** — No classic post screens. CPTs without block editor content get a form-based editing experience that still uses the modern WordPress UI
- **Block Bindings Support** — Fields work with Block Bindings out of the box, so your data can be displayed in templates
- **Layered Definitions** — Supports both code-registered post types and UI-created ones, with the ability to extend core types like Posts and Pages
- **AI-Ready** — Designed with machine-readable schemas for agentic workflows

## WordPress 7.0 and Connectors

This plugin is being developed with an eye toward WordPress 7.0's Connectors initiative. The goal is for content models created here to integrate naturally with external data sources and AI-powered workflows. By keeping close to core structures and exposing clean REST API endpoints, WP Content Types can serve as the content backbone for connected WordPress experiences.

## Installation

1. Download the latest release.
2. Place the `wp-content-types` folder in your `wp-content/plugins/` directory
3. Activate the plugin through the WordPress admin

## Development

1. Clone the repository and navigate to the plugin directory.
2. Run `npm install` and `composer install` to install dependencies.
3. Use `npm run build` to build the plugin assets.

## Requirements

- WordPress 6.9 (7.0+ for AI features)
- PHP 7.4+

## Status

This is an experimental plugin in active development. Not recommended for production use yet.
