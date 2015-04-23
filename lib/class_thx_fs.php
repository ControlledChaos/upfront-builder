<?php

abstract class Thx_Fs {

	public static function get ($name) {
		if ('theme' === $name) $name = false;
		return new Thx_Fs_ThemeDir($name);
	}

	private static function _can_write_directly ($path) {
		if (is_writable($path)) return true;
		else if (function_exists(''))
		return false;
	}
}


abstract class iThx_Fs {

	protected $_theme_name;
	protected $_theme_path;
	protected $_root_path;

	public function __construct ($theme) {
		if (!empty($theme)) $this->set_theme($theme);
	}

	public function set_theme ($theme) {
		$this->_theme_name = $theme;
		$this->_root_path = get_theme_root();
		$this->_theme_path = false;
		if (!empty($this->_theme_name)) {
			$this->_theme_path = $this->get_path(array(
				$this->_theme_name,
			), false);
		}
	}

	public function construct_path ($parts, $relative=true) {
		if (empty($parts)) return false;
		if (!is_array($parts)) $parts = array($parts);

		if (!$relative) array_unshift($parts, $this->get_root_path());

		return join('/', $parts);
	}

	public function construct_theme_path ($parts) { return $this->construct_path($parts, false); }

	public function get_path ($path, $check_existence=true) {
		$fspath = $this->construct_theme_path($path);
		if (empty($fspath)) return false;

		if (!empty($check_existence) && !$this->exists($fspath)) {
			$fspath = false;
		}

		return $fspath;
	}

	public function get_root_path () {
		return !empty($this->_theme_path)
			? $this->_theme_path
			: $this->_root_path
		;
	}
	
	public function write ($path, $content) {
		$path = $this->get_path($path, false);

		if (empty($path)) return false;

		return file_put_contents($path, $content);
	}

	public function drop ($path) {
		$path = $this->get_path($path);

		if (empty($path)) return false;

		return unlink($path);
	}
	
	public function exists ($fspath) {
		if (empty($fspath)) return false;
		return file_exists($fspath);
	}
	
	public function mkdir ($dirpath) {
		if (empty($dirpath) || $this->exists($dirpath)) return false;
		return mkdir($dirpath);
	}

	public function mkdir_p ($parts) {
		$path = $this->get_root_path();
		$success = true;

		foreach ($parts as $part) {
			$path = $this->construct_path($part, true);
			if ($this->exists($path)) continue;
			$success = $this->mkdir($path);
			if (!$success) break;
		}

		return $success;
	}
}



class Thx_Fs_ThemeDir extends iThx_Fs {


}